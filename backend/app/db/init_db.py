import os
import json
import time
import shutil
from sqlalchemy.orm import Session
from .database import engine, SessionLocal, Base, BASE_DIR
from .models import ModelDB, LicenseDB, ActivityDB, ArtifactDB, UserDB

STORAGE_DIR = os.path.join(BASE_DIR, "storage", "models")
ML_MODELS_DIR = os.path.join(os.path.dirname(BASE_DIR), "ml", "models")
METADATA_FILE = os.path.join(ML_MODELS_DIR, "models_metadata.json")

DEMO_CREATOR = "0x24522a62C4aa130225D415Ee2b222fd473E90B83"
DEMO_BUYER = "0x022B8D7378982E11AF76Ad351C58D71501c15A60"
DEMO_ADMIN = "0x740576446aF2EC9F567729073bbE0e4522e3E878"

def init_db():
    # 1. Create tables
    Base.metadata.create_all(bind=engine)

    # 2. Ensure storage directories
    os.makedirs(STORAGE_DIR, exist_ok=True)

    db: Session = SessionLocal()
    try:
        # Check if models exist
        model_count = db.query(ModelDB).count()
        if model_count == 0:
            print("[DB] Seeding models table...")
            raw_models = []
            if os.path.exists(METADATA_FILE):
                try:
                    with open(METADATA_FILE, "r") as f:
                        raw_models = json.load(f)
                except Exception as e:
                    print(f"[DB] Error loading {METADATA_FILE}: {e}")

            if not raw_models:
                raw_models = [
                    {
                        "name": "AgriYield-XGBoost",
                        "version": "v1.2",
                        "framework": "XGBoost",
                        "type": "Regression",
                        "description": "High-precision crop yield forecasting model trained on multispectral climate indices, soil chemistry, and micro-irrigation logs.",
                        "use_case": "Precision agriculture, harvest yield prediction, parametric crop insurance underwriting",
                        "filename": "agri_yield_xgboost.joblib",
                        "filesize": 417182,
                        "hash": "0xc9a9cbb40be84464d74172c63d491137665f2351da7868b68f59e3e71d9d70d8",
                        "ipfs_cid": "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
                        "license_price_eth": "0.05",
                        "metrics": {"r2": 0.955, "mae": 134.3, "rmse": 170.8, "dataset_size": "2,500 records", "features_count": 5, "training_time": "1.42s"},
                    },
                    {
                        "name": "CropClassification-RandomForest",
                        "version": "v1.0",
                        "framework": "Random Forest",
                        "type": "Classification",
                        "description": "Multivariate agro-botanical classifier matching soil nutrient profiles (N-P-K), pH and annual precipitation to optimal crop cultivar strains.",
                        "use_case": "Smart soil suitability recommendation and automated farm planning",
                        "filename": "crop_classification_rf.joblib",
                        "filesize": 1531713,
                        "hash": "0x742f8a8e197c71469200b392c1f91fbe7cb924a218cf8ec3b28f9cf57d851e65",
                        "ipfs_cid": "bafybeihkovi6z7iig22p7lbdft56j4u4w5x34s244s4nflm26e5eef72wq",
                        "license_price_eth": "0.03",
                        "metrics": {"accuracy": 97.2, "f1_score": 0.972, "classes": 5, "dataset_size": "3,000 soil samples", "features_count": 5, "training_time": "0.85s"},
                    },
                    {
                        "name": "ResumeClassifier",
                        "version": "v2.0",
                        "framework": "Scikit-Learn (TF-IDF + Logistic Regression)",
                        "type": "NLP Classification",
                        "description": "High-throughput semantic NLP parser categorizing professional curricula vitae and tech stack portfolios across 8 tech domain verticals.",
                        "use_case": "Automated applicant tracking systems (ATS), talent screening, technical talent matching",
                        "filename": "resume_classifier.joblib",
                        "filesize": 21308,
                        "hash": "0xbca930fe30cc5d7aa619c4314f8d5e8e32382ddaf835032eb564e1f69773369b",
                        "ipfs_cid": "bafybeif47a46k2evqffzftoexh2e3r75k2x4i4tve4aegj346p4rsmk5cq",
                        "license_price_eth": "0.04",
                        "metrics": {"accuracy": 100.0, "vocabulary_size": 1200, "classes": 8, "dataset_size": "480 profiles", "training_time": "0.62s"},
                    },
                ]

            now_ms = int(time.time() * 1000)
            day_ms = 86400000

            for idx, item in enumerate(raw_models, start=1):
                filename = item.get("filename")
                src_path = os.path.join(ML_MODELS_DIR, filename) if filename else None
                dst_path = os.path.join(STORAGE_DIR, filename) if filename else None

                # Copy model binary to persistent storage if available
                if src_path and os.path.exists(src_path) and dst_path:
                    if not os.path.exists(dst_path):
                        shutil.copy2(src_path, dst_path)

                version = item.get("version", "v1.0")
                version_history = ["v1.0"]
                if version == "v1.2":
                    version_history = ["v1.0", "v1.1", "v1.2"]
                elif version == "v2.0":
                    version_history = ["v1.0", "v2.0"]

                model_db = ModelDB(
                    model_id=idx,
                    creator=DEMO_CREATOR,
                    name=item.get("name"),
                    description=item.get("description"),
                    framework=item.get("framework"),
                    version=version,
                    model_type=item.get("type", "General ML"),
                    model_hash=item.get("hash"),
                    ipfs_cid=item.get("ipfs_cid"),
                    license_price_eth=str(item.get("license_price_eth", "0.05")),
                    created_at=now_ms - day_ms * (5 - idx),
                    active=True,
                    license_count=38 if idx == 1 else (19 if idx == 2 else 42),
                    version_history_json=json.dumps(version_history),
                    metrics_json=json.dumps(item.get("metrics", {})),
                    use_case=item.get("use_case"),
                    filename=filename,
                    filesize=item.get("filesize", 0),
                    storage_path=dst_path,
                )
                db.add(model_db)
            db.commit()
            print("[DB] Seeded models successfully.")

        # Check licenses table
        if db.query(LicenseDB).count() == 0:
            print("[DB] Seeding initial licenses...")
            now_ms = int(time.time() * 1000)
            day_ms = 86400000
            demo_license = LicenseDB(
                license_id=1,
                model_id=2,
                model_name="CropClassification-RandomForest",
                creator=DEMO_CREATOR,
                licensee=DEMO_BUYER,
                issued_at=now_ms - day_ms * 4,
                expiry=now_ms + day_ms * 26,
                active=True,
                price_eth="0.03",
                transaction_hash="0x28f7a8c4f90123ee718a38bca8892bfb1a37c4e51928dfa3014c2789ba3881bc",
                created_at=now_ms - day_ms * 4,
            )
            db.add(demo_license)
            db.commit()

        # Check activities table
        if db.query(ActivityDB).count() == 0:
            print("[DB] Seeding initial activities...")
            now_ms = int(time.time() * 1000)
            day_ms = 86400000
            acts = [
                ActivityDB(
                    id="tx-init-1",
                    type="ModelRegistered",
                    user=DEMO_CREATOR,
                    model_name="AgriYield-XGBoost",
                    model_id=1,
                    timestamp=now_ms - day_ms * 5,
                    tx_hash="0x82a91f7d2bc4e5781a0e992b1a5e128df084e365022874ad1362e52b2f694e91",
                    status="Confirmed",
                ),
                ActivityDB(
                    id="tx-init-2",
                    type="ModelRegistered",
                    user=DEMO_CREATOR,
                    model_name="CropClassification-RandomForest",
                    model_id=2,
                    timestamp=now_ms - day_ms * 3,
                    tx_hash="0x4b7e80c6198f7e21a6e788bc57d00f89d311fa6a479a0e678122bb88e9903b21",
                    status="Confirmed",
                ),
                ActivityDB(
                    id="tx-init-3",
                    type="ModelRegistered",
                    user=DEMO_CREATOR,
                    model_name="ResumeClassifier",
                    model_id=3,
                    timestamp=now_ms - day_ms * 1,
                    tx_hash="0xc7382211993478eefbca56b098492067e2a90098dfccbe25055b8aa906e12e87",
                    status="Confirmed",
                ),
                ActivityDB(
                    id="tx-init-4",
                    type="LicensePurchased",
                    user=DEMO_BUYER,
                    model_name="CropClassification-RandomForest",
                    model_id=2,
                    amount_eth="0.03",
                    timestamp=now_ms - day_ms * 4,
                    tx_hash="0x28f7a8c4f90123ee718a38bca8892bfb1a37c4e51928dfa3014c2789ba3881bc",
                    status="Confirmed",
                ),
            ]
            db.add_all(acts)
            db.commit()

        # Seed initial users if empty
        user_count = db.query(UserDB).count()
        if user_count == 0:
            print("[DB] Seeding initial users table...")
            now_ms = int(time.time() * 1000)
            initial_users = [
                UserDB(address=DEMO_CREATOR.lower(), role="creator", first_seen_at=now_ms, last_seen_at=now_ms, is_deactivated=False),
                UserDB(address=DEMO_BUYER.lower(), role="buyer", first_seen_at=now_ms, last_seen_at=now_ms, is_deactivated=False),
                UserDB(address=DEMO_ADMIN.lower(), role="admin", first_seen_at=now_ms, last_seen_at=now_ms, is_deactivated=False),
            ]
            db.add_all(initial_users)
            db.commit()

    except Exception as e:
        db.rollback()
        print(f"[DB] Database initialization error: {e}")
    finally:
        db.close()
