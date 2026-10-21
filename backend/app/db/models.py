from sqlalchemy import Column, Integer, String, Boolean, Text, BigInteger, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class ModelDB(Base):
    __tablename__ = "models"

    model_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    creator = Column(String(42), index=True, nullable=False)
    name = Column(String(128), index=True, nullable=False)
    description = Column(Text, nullable=True)
    framework = Column(String(64), nullable=False)
    version = Column(String(32), nullable=False, default="v1.0")
    model_type = Column(String(64), nullable=False)
    model_hash = Column(String(66), unique=True, index=True, nullable=False)
    ipfs_cid = Column(String(128), nullable=False)
    license_price_eth = Column(String(32), nullable=False, default="0.05")
    created_at = Column(BigInteger, nullable=False)
    active = Column(Boolean, default=True, nullable=False)
    license_count = Column(Integer, default=0, nullable=False)
    version_history_json = Column(Text, default="[]", nullable=False)
    metrics_json = Column(Text, default="{}", nullable=False)
    use_case = Column(Text, nullable=True)
    filename = Column(String(256), nullable=True)
    filesize = Column(Integer, default=0, nullable=False)
    storage_path = Column(String(512), nullable=True)

    licenses = relationship("LicenseDB", back_populates="model", cascade="all, delete-orphan")

class LicenseDB(Base):
    __tablename__ = "licenses"

    license_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    model_id = Column(Integer, ForeignKey("models.model_id"), index=True, nullable=False)
    model_name = Column(String(128), nullable=False)
    creator = Column(String(42), index=True, nullable=False)
    licensee = Column(String(42), index=True, nullable=False)
    issued_at = Column(BigInteger, nullable=False)
    expiry = Column(BigInteger, nullable=False)
    active = Column(Boolean, default=True, nullable=False)
    price_eth = Column(String(32), nullable=False)
    transaction_hash = Column(String(66), nullable=False)
    created_at = Column(BigInteger, nullable=False)
    license_type = Column(String(32), default="30_day_license", nullable=True)

    model = relationship("ModelDB", back_populates="licenses")

class ActivityDB(Base):
    __tablename__ = "activities"

    id = Column(String(64), primary_key=True, index=True)
    type = Column(String(32), nullable=False) # ModelRegistered, LicensePurchased, VersionCreated, etc.
    user = Column(String(42), index=True, nullable=False)
    model_name = Column(String(128), nullable=False)
    model_id = Column(Integer, index=True, nullable=False)
    amount_eth = Column(String(32), nullable=True)
    timestamp = Column(BigInteger, nullable=False)
    tx_hash = Column(String(66), nullable=False)
    status = Column(String(32), default="Confirmed", nullable=False)

class ArtifactDB(Base):
    __tablename__ = "artifacts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    filename = Column(String(256), nullable=False)
    original_name = Column(String(256), nullable=False)
    filesize = Column(Integer, nullable=False)
    sha256_hash = Column(String(66), index=True, nullable=False)
    storage_path = Column(String(512), nullable=False)
    framework = Column(String(64), nullable=True)
    model_type = Column(String(64), nullable=True)
    uploaded_at = Column(BigInteger, nullable=False)
    uploaded_by = Column(String(42), nullable=True)

class UserDB(Base):
    __tablename__ = "users"

    address = Column(String(42), primary_key=True, index=True)
    role = Column(String(32), default="buyer", nullable=False) # buyer, creator, admin
    first_seen_at = Column(BigInteger, nullable=False)
    last_seen_at = Column(BigInteger, nullable=False)
    is_deactivated = Column(Boolean, default=False, nullable=False)
