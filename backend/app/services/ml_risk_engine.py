import os
import logging
import joblib
import pandas as pd
from typing import Dict, Any, List

logger = logging.getLogger("ml_risk_engine")
logger.setLevel(logging.INFO)

_MODEL_ARTIFACT = None

def get_model_artifact():
    global _MODEL_ARTIFACT
    if _MODEL_ARTIFACT is None:
        # Look in backend/app/ml/ or backend/models/
        possible_paths = [
            os.path.join(os.path.dirname(__file__), "..", "ml", "landslide_xgb_model.joblib"),
            os.path.join(os.path.dirname(__file__), "..", "..", "models", "landslide_xgb_model.joblib"),
        ]
        model_path = None
        for p in possible_paths:
            if os.path.exists(p):
                model_path = p
                break

        if not model_path:
            raise FileNotFoundError("Trained ML model artifact not found.")

        _MODEL_ARTIFACT = joblib.load(model_path)
        logger.info("Successfully loaded ML model artifact into memory.")
    return _MODEL_ARTIFACT

def predict_risk_ml(sensor_reading: Any, ward: Any) -> Dict[str, Any]:
    artifact = get_model_artifact()
    model = artifact["model"]
    feature_names = artifact["feature_names"]
    feat_importances = artifact.get("feature_importances", {})

    r1 = float(getattr(sensor_reading, "rainfall_1h_mm", 0.0))
    r24 = float(getattr(sensor_reading, "rainfall_24h_mm", 0.0))
    r72 = float(getattr(sensor_reading, "rainfall_72h_mm", 0.0))
    sm = float(getattr(sensor_reading, "soil_moisture_pct", 0.0))

    slope = float(getattr(sensor_reading, "slope_angle_deg", 0.0))
    if slope == 0.0 and hasattr(ward, "slope_angle_deg"):
        slope = float(getattr(ward, "slope_angle_deg", 30.0))
    if slope == 0.0:
        slope = 30.0

    incidents_count = 2
    if hasattr(ward, "incidents"):
        incidents_count = len(getattr(ward, "incidents", []))
    elif hasattr(ward, "historical_incident_count"):
        incidents_count = int(getattr(ward, "historical_incident_count", 2))

    days_dry = 0 if r1 > 2.0 else (1 if r24 > 5.0 else 3)

    input_df = pd.DataFrame([{
        "rainfall_1h_mm": r1,
        "rainfall_24h_mm": r24,
        "rainfall_72h_mm": r72,
        "soil_moisture_pct": sm,
        "slope_angle_deg": slope,
        "historical_incident_count_in_ward": incidents_count,
        "days_since_last_rain": days_dry
    }])[feature_names]

    prob = float(model.predict_proba(input_df)[0, 1])
    risk_score = round(prob * 100.0, 1)

    if prob >= 0.75:
        risk_level = "Critical"
    elif prob >= 0.50:
        risk_level = "Warning"
    elif prob >= 0.25:
        risk_level = "Watch"
    else:
        risk_level = "Safe"

    cohesion = float(getattr(ward, "soil_cohesion_kpa", 12.0))
    friction_angle = float(getattr(ward, "soil_friction_angle_deg", 30.0))
    unit_weight = float(getattr(ward, "soil_unit_weight_kn_m3", 19.0))

    from backend.app.services.risk_engine import calculate_factor_of_safety
    fos = calculate_factor_of_safety(
        slope_angle_deg=slope,
        soil_moisture_pct=sm,
        cohesion_kpa=cohesion,
        friction_angle_deg=friction_angle,
        unit_weight_kn_m3=unit_weight
    )

    if fos < 1.0:
        fos_label = "unstable"
    elif fos < 1.3:
        fos_label = "marginally stable"
    elif fos < 1.6:
        fos_label = "conditionally stable"
    else:
        fos_label = "stable"

    factors: List[str] = []
    factors.append(f"Factor of Safety: {fos:.2f} — {fos_label}")

    val_map = {
        "rainfall_72h_mm": (r72, f"72h rainfall ({r72:.1f}mm)"),
        "soil_moisture_pct": (sm, f"Soil moisture saturation ({sm:.1f}%)"),
        "slope_angle_deg": (slope, f"Slope angle ({slope:.1f}°)"),
        "rainfall_1h_mm": (r1, f"Short-burst 1h rain ({r1:.1f}mm/h)"),
        "rainfall_24h_mm": (r24, f"24h rain ({r24:.1f}mm)"),
        "historical_incident_count_in_ward": (incidents_count, f"Ward history ({incidents_count} prior incidents)"),
        "days_since_last_rain": (days_dry, f"Recent dry window ({days_dry} days)")
    }

    sorted_features = sorted(feat_importances.items(), key=lambda x: x[1], reverse=True)
    for feat_name, imp_val in sorted_features[:3]:
        val, desc = val_map.get(feat_name, (0, feat_name))
        weight_pct = imp_val * 100.0
        factors.append(f"ML Model Feature Weight: {desc} contributes {weight_pct:.1f}% to hazard scoring")

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
        "factor_of_safety": fos,
        "engine_used": "ml_xgboost",
        "predicted_probability": prob
    }

