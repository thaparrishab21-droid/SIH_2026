"""
ML Inference Risk Engine Module for Flood-Flash Early Warning System.

This module provides ML model inference matching the exact interface of risk_engine.py:
`predict_risk_ml(sensor_reading, ward) -> dict`

It loads the trained XGBoost model from backend/models/landslide_xgb_model.joblib,
extracts features, predicts landslide probability, maps the continuous score (0-100)
to the 4-tier risk level ('Safe', 'Watch', 'Warning', 'Critical'), and generates
human-readable contributing factors based on feature weighting.
"""

import os
import logging
import joblib
import pandas as pd
from typing import Dict, Any, List

logger = logging.getLogger("ml_risk_engine")
logger.setLevel(logging.INFO)

# Global cache for loaded model artifact
_MODEL_ARTIFACT = None

def get_model_artifact():
    global _MODEL_ARTIFACT
    if _MODEL_ARTIFACT is None:
        models_dir = os.path.join(os.path.dirname(__file__), "models")
        model_path = os.path.join(models_dir, "landslide_xgb_model.joblib")
        if not os.path.exists(model_path):
            raise FileNotFoundError(
                f"Trained model artifact not found at {model_path}. Please run 'python -m backend.train_model' first."
            )
        _MODEL_ARTIFACT = joblib.load(model_path)
        logger.info("Successfully loaded ML model artifact into memory.")
    return _MODEL_ARTIFACT

def predict_risk_ml(sensor_reading: Any, ward: Any) -> Dict[str, Any]:
    """
    ML-based risk assessment evaluation for a given ward and sensor reading.

    Args:
        sensor_reading: Object or dict containing rainfall_1h_mm, rainfall_24h_mm,
                        rainfall_72h_mm, soil_moisture_pct, slope_angle_deg.
        ward: Object or dict containing ward details (historical incidents, slope, etc.).

    Returns:
        Dict containing:
            - risk_level: str ('Safe', 'Watch', 'Warning', 'Critical')
            - risk_score: float (0.0 - 100.0)
            - contributing_factors: List[str]
    """
    artifact = get_model_artifact()
    model = artifact["model"]
    feature_names = artifact["feature_names"]
    feat_importances = artifact.get("feature_importances", {})

    # Extract Feature Values
    r1 = float(getattr(sensor_reading, "rainfall_1h_mm", 0.0))
    r24 = float(getattr(sensor_reading, "rainfall_24h_mm", 0.0))
    r72 = float(getattr(sensor_reading, "rainfall_72h_mm", 0.0))
    sm = float(getattr(sensor_reading, "soil_moisture_pct", 0.0))

    slope = float(getattr(sensor_reading, "slope_angle_deg", 0.0))
    if slope == 0.0 and hasattr(ward, "slope_angle_deg"):
        slope = float(getattr(ward, "slope_angle_deg", 30.0))
    if slope == 0.0:
        slope = 30.0

    # Historical incidents count for ward
    incidents_count = 2
    if hasattr(ward, "incidents"):
        incidents_count = len(getattr(ward, "incidents", []))
    elif hasattr(ward, "historical_incident_count"):
        incidents_count = int(getattr(ward, "historical_incident_count", 2))

    days_dry = 0 if r1 > 2.0 else (1 if r24 > 5.0 else 3)

    # Build DataFrame matching training feature columns
    input_df = pd.DataFrame([{
        "rainfall_1h_mm": r1,
        "rainfall_24h_mm": r24,
        "rainfall_72h_mm": r72,
        "soil_moisture_pct": sm,
        "slope_angle_deg": slope,
        "historical_incident_count_in_ward": incidents_count,
        "days_since_last_rain": days_dry
    }])[feature_names]

    # Predict Landslide Probability
    prob = float(model.predict_proba(input_df)[0, 1])
    risk_score = round(prob * 100.0, 1)

    # 4-Tier Risk Classification based on Model Validation Thresholds
    if prob >= 0.75:
        risk_level = "Critical"
    elif prob >= 0.50:
        risk_level = "Warning"
    elif prob >= 0.25:
        risk_level = "Watch"
    else:
        risk_level = "Safe"

    # Generate Human-Readable Contributing Factors based on Feature Importances & Thresholds
    factors: List[str] = []

    # Sort input features by importance weight
    val_map = {
        "rainfall_72h_mm": (r72, f"72h rainfall ({r72:.1f}mm)"),
        "soil_moisture_pct": (sm, f"Soil moisture saturation ({sm:.1f}%)"),
        "slope_angle_deg": (slope, f"Slope angle ({slope:.1f}°)"),
        "rainfall_1h_mm": (r1, f"Short-burst 1h rain ({r1:.1f}mm/h)"),
        "rainfall_24h_mm": (r24, f"24h rain ({r24:.1f}mm)"),
        "historical_incident_count_in_ward": (incidents_count, f"Ward history ({incidents_count} prior incidents)"),
        "days_since_last_rain": (days_dry, f"Recent dry window ({days_dry} days)")
    }

    # Add top 3 contributing factors
    sorted_features = sorted(feat_importances.items(), key=lambda x: x[1], reverse=True)
    for feat_name, imp_val in sorted_features[:3]:
        val, desc = val_map.get(feat_name, (0, feat_name))
        weight_pct = imp_val * 100.0
        factors.append(f"ML Model Feature Weight: {desc} contributes {weight_pct:.1f}% to hazard scoring")

    # Add specific physical alert threshold notes if elevated
    if r72 > 150:
        factors.append(f"72h cumulative rainfall ({r72:.1f}mm) exceeds high-hazard baseline")
    if sm > 65:
        factors.append(f"Soil moisture ({sm:.1f}%) elevated above critical saturation point")
    if slope >= 35:
        factors.append(f"Steep slope angle ({slope:.1f}°) amplifies runoff speed & debris slide probability")

    return {
        "risk_level": risk_level,
        "risk_score": risk_score,
        "contributing_factors": factors,
        "engine_used": "ml_xgboost",
        "predicted_probability": prob
    }
