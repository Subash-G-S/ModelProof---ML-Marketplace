"""
ModelProof Backend — Production FastAPI Application
Provides AI/ML model analysis, cryptographic hashing, comparative metrics, and metadata services.
"""

import os
import json
import hashlib
from typing import List, Dict, Any, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from app.services.ml_service import (
    compute_stream_sha256,
    analyze_model_artifact,
    generate_comparative_recommendation
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODELS_DIR = os.path.join(BASE_DIR, "ml", "models")
METADATA_FILE = os.path.join(MODELS_DIR, "models_metadata.json")

# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[+] ModelProof AI Engine starting...")
    if os.path.exists(METADATA_FILE):
        print(f"[+] Loaded ML metadata from: {METADATA_FILE}")
    else:
        print("[!] ML models metadata not found, demo models will use fallback data.")
    yield
    print("[-] ModelProof AI Engine shutting down.")

# ---------------------------------------------------------------------------
# App & CORS
# ---------------------------------------------------------------------------
app = FastAPI(
    title="ModelProof API",
    description="AI/ML Model Analysis, Fingerprinting & Recommendation Engine",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------
class HealthResponse(BaseModel):
    status: str
    version: str
    models_available: int

class HashResponse(BaseModel):
    hash: str
    file_name: str
    file_size: int

class CompareRequest(BaseModel):
    models: List[Dict[str, Any]]

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint confirming engine readiness."""
    count = 0
    if os.path.exists(METADATA_FILE):
        try:
            with open(METADATA_FILE, "r") as f:
                count = len(json.load(f))
        except Exception:
            pass
    return HealthResponse(status="ok", version="1.0.0", models_available=count)

@app.get("/demo-models")
async def get_demo_models():
    """Retrieve pre-trained sample models with real metrics, hashes, and filesizes."""
    if os.path.exists(METADATA_FILE):
        with open(METADATA_FILE, "r") as f:
            return json.load(f)
    return []

@app.get("/download-sample-model/{filename}")
async def download_sample_model(filename: str):
    """Allows downloading the trained .joblib model files for verification testing."""
    file_path = os.path.join(MODELS_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Requested model artifact not found.")
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/octet-stream"
    )

@app.post("/generate-hash", response_model=HashResponse)
async def generate_hash(file: UploadFile = File(...)):
    """Generate cryptographic SHA-256 hash (0x-prefixed) of an uploaded model file."""
    try:
        contents = await file.read()
        sha256 = compute_stream_sha256(contents)
        return HashResponse(
            hash=sha256,
            file_name=file.filename or "unknown_artifact",
            file_size=len(contents),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hashing failed: {str(e)}")

@app.post("/analyze-model")
async def analyze_model(file: UploadFile = File(...)):
    """
    Performs deep artifact inspection, computes SHA-256 fingerprint,
    and extracts estimator parameters, framework and pipeline details.
    """
    try:
        contents = await file.read()
        analysis = analyze_model_artifact(contents, file.filename or "uploaded_model.joblib")
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model analysis failed: {str(e)}")

@app.post("/compare-models")
async def compare_models(payload: CompareRequest):
    """
    Compares selected models on regression/classification metrics and price,
    returning an explainable AI recommendation based on actual metrics.
    """
    try:
        result = generate_comparative_recommendation(payload.models)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")
