from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# --- Model Schemas ---

class ModelBase(BaseModel):
    name: str
    description: Optional[str] = ""
    framework: str
    version: str = "v1.0"
    model_type: str = "General ML"
    model_hash: str
    ipfs_cid: str
    license_price_eth: str = "0.05"
    use_case: Optional[str] = ""
    metrics: Dict[str, Any] = Field(default_factory=dict)
    filename: Optional[str] = None
    filesize: Optional[int] = 0

class ModelCreate(ModelBase):
    creator: str
    version_history: Optional[List[str]] = Field(default_factory=list)

class ModelVersionCreate(BaseModel):
    parent_model_id: int
    version: str
    model_hash: str
    ipfs_cid: str
    license_price_eth: str
    metrics: Optional[Dict[str, Any]] = None
    filename: Optional[str] = None
    filesize: Optional[int] = 0

class ModelResponse(BaseModel):
    model_id: int
    creator: str
    name: str
    description: Optional[str] = ""
    framework: str
    version: str
    model_type: str
    model_hash: str
    ipfs_cid: str
    license_price_eth: str
    created_at: int
    active: bool
    license_count: int
    version_history: List[str]
    metrics: Dict[str, Any]
    use_case: Optional[str] = ""
    filename: Optional[str] = None
    filesize: int = 0

# --- License / Purchase Schemas ---

class LicenseCreate(BaseModel):
    model_id: int
    model_name: str
    creator: str
    licensee: str
    price_eth: str
    transaction_hash: str
    issued_at: Optional[int] = None
    expiry: Optional[int] = None
    license_type: Optional[str] = "30_day_license"

class LicenseResponse(BaseModel):
    license_id: int
    model_id: int
    model_name: str
    creator: str
    licensee: str
    issued_at: int
    expiry: int
    active: bool
    price_eth: str
    transaction_hash: str
    created_at: int
    license_type: Optional[str] = "30_day_license"

# --- Activity Schemas ---

class ActivityCreate(BaseModel):
    id: Optional[str] = None
    type: str
    user: str
    model_name: str
    model_id: int
    amount_eth: Optional[str] = None
    tx_hash: str
    status: Optional[str] = "Confirmed"
    timestamp: Optional[int] = None

class ActivityResponse(BaseModel):
    id: str
    type: str
    user: str
    model_name: str
    model_id: int
    amount_eth: Optional[str] = None
    timestamp: int
    tx_hash: str
    status: str

# --- Artifact & Stats ---

class ArtifactUploadResponse(BaseModel):
    filename: str
    original_name: str
    filesize: int
    sha256_hash: str
    framework: Optional[str] = None
    model_type: Optional[str] = None
    storage_url: str

class MarketplaceStats(BaseModel):
    total_models: int
    total_licenses_sold: int
    total_volume_eth: float
    total_creators: int
    total_buyers: int

# --- Inference / Prediction Schemas ---

class PredictionRequest(BaseModel):
    licensee: str
    inputs: Any

class PredictionResponse(BaseModel):
    success: bool
    model_id: int
    model_name: str
    prediction: Any
    primary_result: Any
    confidence_percentage: Optional[float] = None
    latency_ms: float
    license_status: Dict[str, Any]

