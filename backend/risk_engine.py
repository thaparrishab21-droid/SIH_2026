"""
Risk Engine Router for Flood-Flash Early Warning System.

This module acts as the unified router for risk evaluation.
Depending on the `RISK_ENGINE_MODE` setting ('ml' or 'rule_based'), it delegates to:
1. `ml_risk_engine.py` (XGBoost Gradient Boosted Classifier)
2. Rule-based threshold engine (Fallback & Benchmark)

If ML inference fails (e.g., missing model weights file), it gracefully falls back
to rule-based logic with a logged operational warning.
"""

import logging
from typing import Dict, Any, List
from backend.config import settings

logger = logging.getLogger("risk_engine")

def calculate_risk_rule_based(sensor_reading: Any, ward: Any) -> Dict[str, Any]:
    """Rule-based risk assessment logic."""
    r1 = getattr(sensor_reading, "rainfall_1h_mm", 0.0)
    r24 = getattr(sensor_reading, "rainfall_24h_mm", 0.0)
    r72 = getattr(sensor_reading, "rainfall_72h_mm", 0.0)
    sm = getattr(sensor_reading, "soil_moisture_pct", 0.0)
    
    slope = getattr(sensor_reading, "slope_angle_deg", 0.0)
    if slope == 0.0 and hasattr(ward, "slope_angle_deg"):
        slope = getattr(ward, "slope_angle_deg", 25.0)

    factors: List[str] = []

    # 1. Base Threshold Determination
    if r72 > 200 and sm > 80:
        base_level = "Critical"
        factors.append(f"72h cumulative rainfall ({r72:.1f}mm) exceeds critical threshold (>200mm)")
        factors.append(f"Soil moisture saturation critical at {sm:.1f}% (>80%)")
    elif r72 > 150 and sm > 65:
        base_level = "Warning"
        factors.append(f"72h cumulative rainfall ({r72:.1f}mm) exceeds warning threshold (>150mm)")
        factors.append(f"Soil moisture elevated at {sm:.1f}% (>65%)")
    elif r72 > 80 or sm > 50:
        base_level = "Watch"
        if r72 > 80:
            factors.append(f"72h cumulative rainfall ({r72:.1f}mm) exceeds watch threshold (>80mm)")
        if sm > 50:
            factors.append(f"Soil moisture saturation moderate at {sm:.1f}% (>50%)")
    else:
        base_level = "Safe"
        factors.append("Rainfall and soil moisture are within normal safety limits")

    # 2. Intense Short-Burst Rainfall Check (Flash Flood trigger)
    if r1 >= 35.0:
        factors.append(f"High-intensity 1h rainfall rate ({r1:.1f}mm/h) increases immediate flash flood risk")
        if base_level in ["Safe", "Watch"]:
            base_level = "Warning"

    # 3. Slope Angle Multiplier
    if slope >= 38.0:
        slope_multiplier = 1.35
        factors.append(f"Steep slope angle ({slope:.1f}°) significantly escalates landslide instability (1.35x multiplier)")
    elif slope >= 30.0:
        slope_multiplier = 1.20
        factors.append(f"Moderate-to-steep slope angle ({slope:.1f}°) increases runoff acceleration (1.20x multiplier)")
    elif slope >= 20.0:
        slope_multiplier = 1.05
    else:
        slope_multiplier = 1.0

    raw_rain_score = min(50.0, (r72 / 250.0) * 50.0)
    raw_soil_score = min(35.0, (sm / 100.0) * 35.0)
    raw_burst_score = min(15.0, (r1 / 50.0) * 15.0)
    
    raw_total = raw_rain_score + raw_soil_score + raw_burst_score
    calculated_score = round(min(100.0, raw_total * slope_multiplier), 1)

    final_level = base_level
    if calculated_score >= 82.0:
        final_level = "Critical"
    elif calculated_score >= 60.0 and final_level in ["Safe", "Watch"]:
        final_level = "Warning"
    elif calculated_score >= 35.0 and final_level == "Safe":
        final_level = "Watch"

    return {
        "risk_level": final_level,
        "risk_score": calculated_score,
        "contributing_factors": factors,
        "engine_used": "rule_based"
    }

def calculate_risk(sensor_reading: Any, ward: Any) -> Dict[str, Any]:
    """
    Main risk assessment entry point. Routes to ML model or Rule-Based engine
    based on settings.RISK_ENGINE_MODE ('ml' vs 'rule_based').
    """
    mode = getattr(settings, "RISK_ENGINE_MODE", "ml").lower()

    if mode == "ml":
        try:
            from backend.ml_risk_engine import predict_risk_ml
            return predict_risk_ml(sensor_reading, ward)
        except Exception as e:
            logger.warning(f"ML risk engine execution failed or model file not found ({e}). Falling back to rule-based engine.")
            return calculate_risk_rule_based(sensor_reading, ward)
    else:
        return calculate_risk_rule_based(sensor_reading, ward)
