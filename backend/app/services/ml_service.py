"""
ModelProof — Machine Learning Model Analysis Service
Provides deep artifact introspection, cryptographic hashing, and metric evaluations.
"""

import os
import io
import json
import hashlib
from typing import Dict, Any, List, Optional
import joblib

def compute_stream_sha256(file_bytes: bytes) -> str:
    """Returns 0x-prefixed SHA-256 hash of bytes."""
    return "0x" + hashlib.sha256(file_bytes).hexdigest()

def analyze_model_artifact(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Inspects model bytes, computes SHA-256, and extracts estimator architecture
    and parameters if it is a supported serialization format (joblib/pickle).
    """
    file_size = len(file_bytes)
    sha256_hash = compute_stream_sha256(file_bytes)

    analysis: Dict[str, Any] = {
        "filename": filename,
        "file_size_bytes": file_size,
        "sha256_hash": sha256_hash,
        "is_valid_ml_artifact": False,
        "framework": "Unknown",
        "model_type": "Generic ML Artifact",
        "parameters": {},
        "summary": ""
    }

    # Attempt deserialization in safe memory buffer
    try:
        buffer = io.BytesIO(file_bytes)
        model_obj = joblib.load(buffer)
        analysis["is_valid_ml_artifact"] = True

        cls_name = model_obj.__class__.__name__
        module_name = getattr(model_obj.__class__, "__module__", "")

        if "xgboost" in module_name.lower() or "XGB" in cls_name:
            analysis["framework"] = "XGBoost"
            analysis["model_type"] = "Gradient Boosted Trees (Regression/Classification)"
            if hasattr(model_obj, "get_params"):
                params = model_obj.get_params()
                analysis["parameters"] = {
                    "n_estimators": params.get("n_estimators"),
                    "max_depth": params.get("max_depth"),
                    "learning_rate": params.get("learning_rate"),
                }
            analysis["summary"] = f"Valid XGBoost estimator ({cls_name}) with configured hyperparameters."

        elif "ensemble" in module_name.lower() or "Forest" in cls_name:
            analysis["framework"] = "Scikit-Learn (RandomForest)"
            analysis["model_type"] = "Ensemble Bagging Classifier/Regressor"
            if hasattr(model_obj, "n_estimators"):
                analysis["parameters"] = {
                    "n_estimators": getattr(model_obj, "n_estimators", 100),
                    "max_depth": getattr(model_obj, "max_depth", None),
                    "n_classes": getattr(model_obj, "n_classes_", None),
                }
            analysis["summary"] = f"Valid Scikit-Learn RandomForest model ({cls_name})."

        elif "pipeline" in module_name.lower() or "Pipeline" in cls_name:
            analysis["framework"] = "Scikit-Learn (Pipeline)"
            analysis["model_type"] = "Multi-stage Processing Pipeline"
            steps = [s[0] for s in getattr(model_obj, "steps", [])]
            analysis["parameters"] = {"pipeline_steps": steps}
            analysis["summary"] = f"Scikit-Learn Composite Pipeline: {' -> '.join(steps)}"

        else:
            analysis["framework"] = f"Python ML ({module_name.split('.')[0]})"
            analysis["model_type"] = cls_name
            analysis["summary"] = f"Serialized Python ML model: {cls_name}"

    except Exception:
        # If not joblib/pickle (e.g., raw binary or ONNX), analyze based on extension
        ext = os.path.splitext(filename)[1].lower()
        if ext in [".onnx"]:
            analysis["framework"] = "ONNX"
            analysis["model_type"] = "Open Neural Network Exchange"
            analysis["is_valid_ml_artifact"] = True
            analysis["summary"] = "ONNX computational graph artifact."
        elif ext in [".pt", ".pth"]:
            analysis["framework"] = "PyTorch"
            analysis["model_type"] = "PyTorch State Dict / TorchScript"
            analysis["is_valid_ml_artifact"] = True
            analysis["summary"] = "PyTorch tensor weight checkpoint."
        elif ext in [".h5", ".keras"]:
            analysis["framework"] = "TensorFlow / Keras"
            analysis["model_type"] = "HDF5 Neural Network Weights"
            analysis["is_valid_ml_artifact"] = True
            analysis["summary"] = "Keras neural network architecture and weights."
        else:
            analysis["framework"] = "Binary Artifact"
            analysis["summary"] = f"Standard binary file ({ext or 'raw bytes'})."

    return analysis

def generate_comparative_recommendation(models: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Ranks models based on numeric metrics (R2, Accuracy, MAE, RMSE) and price,
    returning an explainable AI recommendation.
    """
    if not models:
        return {"recommendation": "No models provided for comparison.", "ranked_models": []}

    # Evaluate scores
    evaluated = []
    for m in models:
        metrics = m.get("metrics", {})
        score = 0.0

        # Regression comparison
        if "r2" in metrics:
            score += float(metrics.get("r2", 0)) * 100
            mae = float(metrics.get("mae", 500))
            score -= (mae / 10)  # Lower MAE is better
        # Classification comparison
        elif "accuracy" in metrics:
            score += float(metrics.get("accuracy", 0))

        # Price factor: penalize higher price slightly
        price = float(m.get("license_price_eth", 0.05))
        score -= (price * 50)

        evaluated.append({
            "id": m.get("id", m.get("name")),
            "name": m.get("name"),
            "framework": m.get("framework"),
            "score": round(score, 2),
            "metrics": metrics,
            "license_price_eth": price
        })

    ranked = sorted(evaluated, key=lambda x: x["score"], reverse=True)
    best = ranked[0]

    rationale_parts = []
    if "r2" in best["metrics"]:
        rationale_parts.append(f"achieving superior coefficient of determination (R² = {best['metrics']['r2']}) and competitive MAE ({best['metrics'].get('mae', 'N/A')})")
    elif "accuracy" in best["metrics"]:
        rationale_parts.append(f"delivering high categorical accuracy ({best['metrics']['accuracy']}%)")

    rationale_parts.append(f"at a competitive license rate of {best['license_price_eth']} ETH")

    recommendation = (
        f"'{best['name']}' is recommended as the optimal candidate, "
        + " ".join(rationale_parts)
        + ". It provides the highest balanced performance-to-cost ratio among the compared models."
    )

    return {
        "recommended_model": best["name"],
        "recommendation_text": recommendation,
        "ranked_models": ranked
    }
