import os
import json
import time
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.database import get_db, BASE_DIR
from app.db.models import ModelDB, LicenseDB, ActivityDB, ArtifactDB
from app.db.schemas import (
    ModelCreate,
    ModelResponse,
    ModelVersionCreate,
    LicenseCreate,
    LicenseResponse,
    ActivityCreate,
    ActivityResponse,
    ArtifactUploadResponse,
    MarketplaceStats,
    PredictionRequest,
    PredictionResponse,
)
from app.services.ml_service import compute_stream_sha256, analyze_model_artifact, execute_model_prediction

router = APIRouter(prefix="/api", tags=["marketplace"])

STORAGE_DIR = os.path.join(BASE_DIR, "storage", "models")
ML_MODELS_DIR = os.path.join(os.path.dirname(BASE_DIR), "ml", "models")

def model_to_response(m: ModelDB) -> ModelResponse:
    try:
        ver_hist = json.loads(m.version_history_json) if m.version_history_json else [m.version]
    except Exception:
        ver_hist = [m.version]

    try:
        metrics = json.loads(m.metrics_json) if m.metrics_json else {}
    except Exception:
        metrics = {}

    return ModelResponse(
        model_id=m.model_id,
        creator=m.creator,
        name=m.name,
        description=m.description or "",
        framework=m.framework,
        version=m.version,
        model_type=m.model_type,
        model_hash=m.model_hash,
        ipfs_cid=m.ipfs_cid,
        license_price_eth=m.license_price_eth,
        created_at=m.created_at,
        active=m.active,
        license_count=m.license_count,
        version_history=ver_hist,
        metrics=metrics,
        use_case=m.use_case or "",
        filename=m.filename,
        filesize=m.filesize or 0,
    )

def license_to_response(lic: LicenseDB) -> LicenseResponse:
    return LicenseResponse(
        license_id=lic.license_id,
        model_id=lic.model_id,
        model_name=lic.model_name,
        creator=lic.creator,
        licensee=lic.licensee,
        issued_at=lic.issued_at,
        expiry=lic.expiry,
        active=lic.active,
        price_eth=lic.price_eth,
        transaction_hash=lic.transaction_hash,
        created_at=lic.created_at,
    )

# ---------------------------------------------------------------------------
# Models Endpoints
# ---------------------------------------------------------------------------

@router.get("/models", response_model=List[ModelResponse])
def get_all_models(
    creator: Optional[str] = None,
    framework: Optional[str] = None,
    active_only: bool = False,
    db: Session = Depends(get_db)
):
    query = db.query(ModelDB)
    if active_only:
        query = query.filter(ModelDB.active == True)
    if creator:
        query = query.filter(ModelDB.creator.ilike(creator))
    if framework:
        query = query.filter(ModelDB.framework.ilike(f"%{framework}%"))

    models = query.order_by(desc(ModelDB.created_at)).all()
    return [model_to_response(m) for m in models]

@router.get("/models/{model_id}", response_model=ModelResponse)
def get_model_by_id(model_id: int, db: Session = Depends(get_db)):
    model = db.query(ModelDB).filter(ModelDB.model_id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return model_to_response(model)

@router.get("/models/by-hash/{model_hash}", response_model=ModelResponse)
def get_model_by_hash(model_hash: str, db: Session = Depends(get_db)):
    clean_hash = model_hash.lower()
    model = db.query(ModelDB).filter(ModelDB.model_hash.ilike(clean_hash)).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model with specified SHA-256 fingerprint not found")
    return model_to_response(model)

@router.post("/models", response_model=ModelResponse)
def register_model(payload: ModelCreate, db: Session = Depends(get_db)):
    # Check if hash already exists
    existing = db.query(ModelDB).filter(ModelDB.model_hash.ilike(payload.model_hash.lower())).first()
    if existing:
        raise HTTPException(status_code=400, detail="A model with this SHA-256 hash is already registered.")

    now_ms = int(time.time() * 1000)
    ver_history = payload.version_history if payload.version_history else [payload.version]

    # Resolve model file if uploaded
    storage_path = None
    if payload.filename:
        possible_storage = os.path.join(STORAGE_DIR, payload.filename)
        if os.path.exists(possible_storage):
            storage_path = possible_storage
        else:
            possible_ml = os.path.join(ML_MODELS_DIR, payload.filename)
            if os.path.exists(possible_ml):
                storage_path = possible_ml

    new_model = ModelDB(
        creator=payload.creator,
        name=payload.name,
        description=payload.description or "",
        framework=payload.framework,
        version=payload.version,
        model_type=payload.model_type,
        model_hash=payload.model_hash.lower(),
        ipfs_cid=payload.ipfs_cid,
        license_price_eth=payload.license_price_eth,
        created_at=now_ms,
        active=True,
        license_count=0,
        version_history_json=json.dumps(ver_history),
        metrics_json=json.dumps(payload.metrics or {}),
        use_case=payload.use_case or "",
        filename=payload.filename,
        filesize=payload.filesize or 0,
        storage_path=storage_path,
    )
    db.add(new_model)
    db.commit()
    db.refresh(new_model)

    # Automatically log activity
    activity = ActivityDB(
        id=f"tx-reg-{new_model.model_id}-{int(time.time())}",
        type="ModelRegistered",
        user=new_model.creator,
        model_name=new_model.name,
        model_id=new_model.model_id,
        timestamp=now_ms,
        tx_hash=f"0x{os.urandom(32).hex()}",
        status="Confirmed",
    )
    db.add(activity)
    db.commit()

    return model_to_response(new_model)

@router.post("/models/{model_id}/version", response_model=ModelResponse)
def create_model_version(model_id: int, payload: ModelVersionCreate, db: Session = Depends(get_db)):
    parent = db.query(ModelDB).filter(ModelDB.model_id == model_id).first()
    if not parent:
        raise HTTPException(status_code=404, detail="Parent model not found")

    now_ms = int(time.time() * 1000)
    try:
        history = json.loads(parent.version_history_json) if parent.version_history_json else [parent.version]
    except Exception:
        history = [parent.version]

    if payload.version not in history:
        history.append(payload.version)

    # Update parent or create new version model
    new_version_model = ModelDB(
        creator=parent.creator,
        name=parent.name,
        description=parent.description,
        framework=parent.framework,
        version=payload.version,
        model_type=parent.model_type,
        model_hash=payload.model_hash.lower(),
        ipfs_cid=payload.ipfs_cid,
        license_price_eth=payload.license_price_eth,
        created_at=now_ms,
        active=True,
        license_count=0,
        version_history_json=json.dumps(history),
        metrics_json=json.dumps(payload.metrics or {}),
        use_case=parent.use_case,
        filename=payload.filename or parent.filename,
        filesize=payload.filesize or parent.filesize,
    )
    parent.version_history_json = json.dumps(history)
    db.add(new_version_model)
    db.commit()
    db.refresh(new_version_model)

    return model_to_response(new_version_model)

@router.patch("/models/{model_id}/status", response_model=ModelResponse)
def toggle_model_status(model_id: int, active: bool = Query(...), db: Session = Depends(get_db)):
    model = db.query(ModelDB).filter(ModelDB.model_id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    model.active = active
    db.commit()
    db.refresh(model)
    return model_to_response(model)

# ---------------------------------------------------------------------------
# Purchases / Licenses Endpoints
# ---------------------------------------------------------------------------

@router.get("/licenses", response_model=List[LicenseResponse])
def get_licenses(
    licensee: Optional[str] = None,
    creator: Optional[str] = None,
    model_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(LicenseDB)
    if licensee:
        query = query.filter(LicenseDB.licensee.ilike(licensee))
    if creator:
        query = query.filter(LicenseDB.creator.ilike(creator))
    if model_id is not None:
        query = query.filter(LicenseDB.model_id == model_id)

    licenses = query.order_by(desc(LicenseDB.issued_at)).all()
    return [license_to_response(l) for l in licenses]

@router.post("/licenses", response_model=LicenseResponse)
def purchase_license(payload: LicenseCreate, db: Session = Depends(get_db)):
    model = db.query(ModelDB).filter(ModelDB.model_id == payload.model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    now_ms = int(time.time() * 1000)
    issued_at = payload.issued_at or now_ms
    expiry = payload.expiry or (issued_at + 30 * 24 * 60 * 60 * 1000)

    # 1. Create persistent license record
    new_license = LicenseDB(
        model_id=payload.model_id,
        model_name=payload.model_name or model.name,
        creator=payload.creator or model.creator,
        licensee=payload.licensee,
        issued_at=issued_at,
        expiry=expiry,
        active=True,
        price_eth=payload.price_eth or model.license_price_eth,
        transaction_hash=payload.transaction_hash,
        created_at=now_ms,
    )
    db.add(new_license)

    # 2. Increment model license count
    model.license_count = (model.license_count or 0) + 1

    # 3. Add to activity ledger
    act = ActivityDB(
        id=f"tx-lic-{int(time.time())}-{os.urandom(4).hex()}",
        type="LicensePurchased",
        user=payload.licensee,
        model_name=model.name,
        model_id=model.model_id,
        amount_eth=payload.price_eth or model.license_price_eth,
        timestamp=now_ms,
        tx_hash=payload.transaction_hash,
        status="Confirmed",
    )
    db.add(act)

    db.commit()
    db.refresh(new_license)
    return license_to_response(new_license)

@router.get("/licenses/check")
def check_active_license(
    model_id: int,
    licensee: str,
    db: Session = Depends(get_db)
):
    now_ms = int(time.time() * 1000)
    lic = (
        db.query(LicenseDB)
        .filter(
            LicenseDB.model_id == model_id,
            LicenseDB.licensee.ilike(licensee),
            LicenseDB.active == True,
            LicenseDB.expiry > now_ms,
        )
        .first()
    )
    if lic:
        return {"has_active_license": True, "license": license_to_response(lic)}
    return {"has_active_license": False, "license": None}

# ---------------------------------------------------------------------------
# Model Storage & Artifact Upload / Download
# ---------------------------------------------------------------------------

@router.post("/models/upload-artifact", response_model=ArtifactUploadResponse)
async def upload_model_artifact(
    file: UploadFile = File(...),
    creator_address: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Saves physical model weights to backend storage, calculates SHA-256 fingerprint,
    extracts ML framework & model architecture details, and persists in artifact registry.
    """
    try:
        contents = await file.read()
        sha256 = compute_stream_sha256(contents)
        file_size = len(contents)

        # Sanitize filename
        safe_filename = file.filename.replace(" ", "_")
        target_path = os.path.join(STORAGE_DIR, safe_filename)

        # Write to disk
        with open(target_path, "wb") as f:
            f.write(contents)

        # Analyze ML artifact
        analysis = analyze_model_artifact(contents, safe_filename)

        # Record in Artifacts table
        now_ms = int(time.time() * 1000)
        artifact = ArtifactDB(
            filename=safe_filename,
            original_name=file.filename,
            filesize=file_size,
            sha256_hash=sha256,
            storage_path=target_path,
            framework=analysis.get("framework", "Unknown"),
            model_type=analysis.get("model_type", "General ML"),
            uploaded_at=now_ms,
            uploaded_by=creator_address,
        )
        db.add(artifact)
        db.commit()

        return ArtifactUploadResponse(
            filename=safe_filename,
            original_name=file.filename,
            filesize=file_size,
            sha256_hash=sha256,
            framework=analysis.get("framework"),
            model_type=analysis.get("model_type"),
            storage_url=f"/api/models/download-file/{safe_filename}",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store model artifact: {str(e)}")

@router.get("/models/{model_id}/download")
def download_model_weights(
    model_id: int,
    licensee: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Direct model artifact download endpoint.
    If licensee is provided, checks database for valid active license.
    """
    model = db.query(ModelDB).filter(ModelDB.model_id == model_id).first()
    if not model or not model.filename:
        raise HTTPException(status_code=404, detail="Model artifact not registered")

    # Locate file on disk
    file_path = None
    if model.storage_path and os.path.exists(model.storage_path):
        file_path = model.storage_path
    else:
        candidate_1 = os.path.join(STORAGE_DIR, model.filename)
        candidate_2 = os.path.join(ML_MODELS_DIR, model.filename)
        if os.path.exists(candidate_1):
            file_path = candidate_1
        elif os.path.exists(candidate_2):
            file_path = candidate_2

    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Physical model weights file not found on server")

    # Check license if licensee provided
    if licensee:
        now_ms = int(time.time() * 1000)
        is_creator = model.creator.lower() == licensee.lower()
        has_lic = (
            db.query(LicenseDB)
            .filter(
                LicenseDB.model_id == model_id,
                LicenseDB.licensee.ilike(licensee),
                LicenseDB.active == True,
                LicenseDB.expiry > now_ms,
            )
            .first()
        )
        if not is_creator and not has_lic:
            raise HTTPException(status_code=403, detail="Active license required to download this model")

    return FileResponse(
        path=file_path,
        filename=model.filename,
        media_type="application/octet-stream",
    )

@router.get("/models/download-file/{filename}")
def download_by_filename(filename: str):
    """Direct file download from storage."""
    p1 = os.path.join(STORAGE_DIR, filename)
    p2 = os.path.join(ML_MODELS_DIR, filename)
    target = p1 if os.path.exists(p1) else (p2 if os.path.exists(p2) else None)
    if not target:
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path=target, filename=filename, media_type="application/octet-stream")

# ---------------------------------------------------------------------------
# Hosted Model Inference Endpoint (Active License Gated)
# ---------------------------------------------------------------------------

@router.post("/models/{model_id}/predict", response_model=PredictionResponse)
def predict_model_inference(
    model_id: int,
    payload: PredictionRequest,
    db: Session = Depends(get_db)
):
    """
    Executes live model inference strictly gated by active on-chain/DB 30-day license.
    Once a 30-day license expires, access is automatically blocked with 403 Forbidden.
    """
    model = db.query(ModelDB).filter(ModelDB.model_id == model_id).first()
    if not model or not model.filename:
        raise HTTPException(status_code=404, detail="Model artifact not registered")

    now_ms = int(time.time() * 1000)
    user_address = payload.licensee.strip().lower()

    # 1. Check if user is the model creator
    is_creator = model.creator.lower() == user_address

    # 2. Check for active unexpired license
    license_record = (
        db.query(LicenseDB)
        .filter(
            LicenseDB.model_id == model_id,
            LicenseDB.licensee.ilike(user_address),
            LicenseDB.active == True,
            LicenseDB.expiry > now_ms,
        )
        .first()
    )

    if not is_creator and not license_record:
        # Check if they previously had a license that has now expired
        expired_lic = (
            db.query(LicenseDB)
            .filter(
                LicenseDB.model_id == model_id,
                LicenseDB.licensee.ilike(user_address),
            )
            .order_by(desc(LicenseDB.expiry))
            .first()
        )
        if expired_lic:
            expiry_str = time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime(expired_lic.expiry / 1000))
            raise HTTPException(
                status_code=403,
                detail=f"Access Denied: Your 30-day license for '{model.name}' expired on {expiry_str}. Please renew your license on ModelProof to query this model."
            )
        raise HTTPException(
            status_code=403,
            detail=f"Access Denied: Active 30-day license required to query '{model.name}'. Please purchase a license to unlock hosted inference."
        )

    # 3. Locate physical model artifact
    file_path = None
    if model.storage_path and os.path.exists(model.storage_path):
        file_path = model.storage_path
    else:
        c1 = os.path.join(STORAGE_DIR, model.filename)
        c2 = os.path.join(ML_MODELS_DIR, model.filename)
        if os.path.exists(c1):
            file_path = c1
        elif os.path.exists(c2):
            file_path = c2

    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=500, detail="Physical model weights file missing from storage repository.")

    # 4. Execute prediction
    try:
        result = execute_model_prediction(file_path, payload.inputs)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Inference execution failed: {str(e)}")

    days_left = 999 if is_creator else max(0, int((license_record.expiry - now_ms) / (1000 * 60 * 60 * 24)))

    return PredictionResponse(
        success=True,
        model_id=model.model_id,
        model_name=model.name,
        prediction=result["prediction"],
        primary_result=result["primary_result"],
        confidence_percentage=result.get("confidence_percentage"),
        latency_ms=result["latency_ms"],
        license_status={
            "authorized": True,
            "is_creator": is_creator,
            "license_id": license_record.license_id if license_record else None,
            "days_remaining": days_left,
        }
    )

# ---------------------------------------------------------------------------
# Activity & Marketplace Stats
# ---------------------------------------------------------------------------

@router.get("/activities", response_model=List[ActivityResponse])
def get_activities(limit: int = 50, db: Session = Depends(get_db)):
    acts = db.query(ActivityDB).order_by(desc(ActivityDB.timestamp)).limit(limit).all()
    return [
        ActivityResponse(
            id=a.id,
            type=a.type,
            user=a.user,
            model_name=a.model_name,
            model_id=a.model_id,
            amount_eth=a.amount_eth,
            timestamp=a.timestamp,
            tx_hash=a.tx_hash,
            status=a.status,
        )
        for a in acts
    ]

@router.post("/activities", response_model=ActivityResponse)
def record_activity(payload: ActivityCreate, db: Session = Depends(get_db)):
    act_id = payload.id or f"tx-{int(time.time())}-{os.urandom(4).hex()}"
    now_ms = payload.timestamp or int(time.time() * 1000)

    act = ActivityDB(
        id=act_id,
        type=payload.type,
        user=payload.user,
        model_name=payload.model_name,
        model_id=payload.model_id,
        amount_eth=payload.amount_eth,
        timestamp=now_ms,
        tx_hash=payload.tx_hash,
        status=payload.status or "Confirmed",
    )
    db.add(act)
    db.commit()
    return ActivityResponse(
        id=act.id,
        type=act.type,
        user=act.user,
        model_name=act.model_name,
        model_id=act.model_id,
        amount_eth=act.amount_eth,
        timestamp=act.timestamp,
        tx_hash=act.tx_hash,
        status=act.status,
    )

@router.get("/stats", response_model=MarketplaceStats)
def get_marketplace_stats(db: Session = Depends(get_db)):
    total_models = db.query(ModelDB).count()
    total_licenses = db.query(LicenseDB).count()

    licenses = db.query(LicenseDB).all()
    total_volume = 0.0
    creators_set = set()
    buyers_set = set()

    for m in db.query(ModelDB).all():
        creators_set.add(m.creator.lower())

    for l in licenses:
        try:
            total_volume += float(l.price_eth)
        except Exception:
            pass
        buyers_set.add(l.licensee.lower())

    return MarketplaceStats(
        total_models=total_models,
        total_licenses_sold=total_licenses,
        total_volume_eth=round(total_volume, 4),
        total_creators=len(creators_set),
        total_buyers=len(buyers_set),
    )
