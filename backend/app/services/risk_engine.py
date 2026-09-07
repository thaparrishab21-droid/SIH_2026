import logging
import math
from typing import Dict, Any, List
from backend.app.config import settings

logger = logging.getLogger("risk_engine")

def calculate_factor_of_safety(
    slope_angle_deg: float,
    soil_moisture_pct: float,
    cohesion_kpa: float = 12.0,
    friction_angle_deg: float = 30.0,
    unit_weight_kn_m3: float = 19.0,
    water_unit_weight_kn_m3: float = 9.81
) -> float:
    """
    Infinite-slope stability Factor of Safety (FoS):
    FoS = [c + (γ - γw·m)·cos²(β)·tanφ] / [γ·sin(β)·cos(β)]
    where:
      c = soil cohesion (kPa)
      γ = soil unit weight (kN/m³)
      γw = water unit weight (9.81 kN/m³)
      m = pore pressure ratio (derived from soil_moisture_pct)
      β = slope angle (radians)
      φ = soil internal friction angle (radians)
    """
    if slope_angle_deg <= 0.5:
        return 10.0

    beta = math.radians(slope_angle_deg)
    phi = math.radians(friction_angle_deg)
    m = max(0.0, min(1.0, soil_moisture_pct / 100.0))

    gamma = unit_weight_kn_m3
    gamma_w = water_unit_weight_kn_m3
    c = cohesion_kpa

    sin_b = math.sin(beta)
    cos_b = math.cos(beta)
    denom = gamma * sin_b * cos_b

    if denom <= 0.0001:
        return 10.0

    num = c + (gamma - gamma_w * m) * (cos_b ** 2) * math.tan(phi)
    fos = num / denom
    return max(0.0, round(fos, 2))

def calculate_risk_rule_based(sensor_reading: Any, ward: Any) -> Dict[str, Any]:
    r1 = getattr(sensor_reading, "rainfall_1h_mm", 0.0)
    r24 = getattr(sensor_reading, "rainfall_24h_mm", 0.0)
    r72 = getattr(sensor_reading, "rainfall_72h_mm", 0.0)
    sm = getattr(sensor_reading, "soil_moisture_pct", 0.0)
    
    slope = getattr(sensor_reading, "slope_angle_deg", 0.0)
    if slope == 0.0 and hasattr(ward, "slope_angle_deg"):
        slope = getattr(ward, "slope_angle_deg", 25.0)

    cohesion = float(getattr(ward, "soil_cohesion_kpa", 12.0))
    friction_angle = float(getattr(ward, "soil_friction_angle_deg", 30.0))
    unit_weight = float(getattr(ward, "soil_unit_weight_kn_m3", 19.0))

    fos = calculate_factor_of_safety(
        slope_angle_deg=slope,
        soil_moisture_pct=sm,
        cohesion_kpa=cohesion,
        friction_angle_deg=friction_angle,
        unit_weight_kn_m3=unit_weight
    )

    factors: List[str] = []

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

    if r1 >= 35.0:
        factors.append(f"High-intensity 1h rainfall rate ({r1:.1f}mm/h) increases immediate flash flood risk")
        if base_level in ["Safe", "Watch"]:
            base_level = "Warning"

    if fos < 1.0:
        fos_label = "unstable"
        fos_multiplier = 1.35
    elif fos < 1.3:
        fos_label = "marginally stable"
        fos_multiplier = 1.20
    elif fos < 1.6:
        fos_label = "conditionally stable"
        fos_multiplier = 1.05
    else:
        fos_label = "stable"
        fos_multiplier = 1.0

    factors.append(f"Factor of Safety: {fos:.2f} — {fos_label}")

    raw_rain_score = min(50.0, (r72 / 250.0) * 50.0)
    raw_soil_score = min(35.0, (sm / 100.0) * 35.0)
    raw_burst_score = min(15.0, (r1 / 50.0) * 15.0)
    
    raw_total = raw_rain_score + raw_soil_score + raw_burst_score
    calculated_score = round(min(100.0, raw_total * fos_multiplier), 1)

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
        "factor_of_safety": fos,
        "engine_used": "rule_based"
    }


def calculate_risk(sensor_reading: Any, ward: Any) -> Dict[str, Any]:
    mode = getattr(settings, "RISK_ENGINE_MODE", "ml").lower()

    if mode == "ml":
        try:
            from backend.app.services.ml_risk_engine import predict_risk_ml
            return predict_risk_ml(sensor_reading, ward)
        except Exception as e:
            logger.warning(f"ML risk engine execution failed or model file not found ({e}). Falling back to rule-based engine.")
            return calculate_risk_rule_based(sensor_reading, ward)
    else:
        return calculate_risk_rule_based(sensor_reading, ward)
