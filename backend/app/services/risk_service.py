import math
import numpy as np
from typing import Dict, List, Any
from app.ml.inference.predict import predict_flash_flood, predict_landslide

# Centralized Configurable Risk Fusion Weights
RISK_WEIGHTS = {
    "flood_prob": 0.35,
    "landslide_prob": 0.25,
    "rainfall_severity": 0.15,
    "terrain_risk": 0.15,
    "exposure_risk": 0.10
}

def calculate_rainfall_severity(r1: float, r24: float, intensity: float) -> float:
    """Normalize rainfall severity to 0.0-1.0 scale."""
    score = (0.4 * min(r1 / 40.0, 1.0)) + (0.4 * min(r24 / 150.0, 1.0)) + (0.2 * min(intensity / 30.0, 1.0))
    return round(float(min(score, 1.0)), 4)

def calculate_terrain_risk(slope: float, elevation: float, roughness: float, river_dist: float) -> float:
    """Normalize terrain vulnerability to 0.0-1.0 scale."""
    slope_factor = min(slope / 45.0, 1.0)
    river_factor = 1.0 - min(river_dist / 1500.0, 1.0)
    score = (0.5 * slope_factor) + (0.3 * river_factor) + (0.2 * roughness)
    return round(float(min(score, 1.0)), 4)

def estimate_lead_time(overall_risk_score: float, rainfall_intensity: float, slope: float) -> Dict[str, Any]:
    """Estimate lead time before flood/landslide threshold crossing."""
    if overall_risk_score < 30:
        return {"lead_time_minutes": 180, "range_min": 150, "range_max": 240, "urgency": "LOW"}
    
    # Runoff velocity formula: higher slope & intensity means faster accumulation
    runoff_velocity_factor = (slope / 20.0) * (1.0 + (rainfall_intensity / 25.0))
    base_mins = max(15, int(120 / (1.0 + (overall_risk_score / 25.0) * runoff_velocity_factor)))
    
    margin = max(5, int(base_mins * 0.25))
    urgency = "CRITICAL" if base_mins <= 30 else ("HIGH" if base_mins <= 60 else "MODERATE")
    
    return {
        "lead_time_minutes": base_mins,
        "range_min": max(10, base_mins - margin),
        "range_max": base_mins + margin,
        "urgency": urgency
    }

def generate_risk_explanation(features: Dict[str, Any], flood_p: float, land_p: float, r_sev: float, t_risk: float) -> List[Dict[str, Any]]:
    """Generate dynamic explainable AI breakdown explaining WHY risk score was generated."""
    factors = []

    # 1. Rainfall Factor
    r24 = features.get('rainfall_24h', 0.0)
    if r24 >= 100 or r_sev >= 0.75:
        factors.append({
            "factor_name": "Extreme 24-Hour Rainfall",
            "factor_value": f"{round(r24, 1)} mm / 24h",
            "contribution": 35.0,
            "severity": "HIGH" if r24 < 120 else "CRITICAL"
        })
    elif r24 >= 45:
        factors.append({
            "factor_name": "Elevated Rainfall Accumulation",
            "factor_value": f"{round(r24, 1)} mm / 24h",
            "contribution": 20.0,
            "severity": "MODERATE"
        })

    # 2. Slope Susceptibility Factor
    slope = features.get('slope', 0.0)
    if slope >= 30:
        factors.append({
            "factor_name": "Steep Slope Susceptibility",
            "factor_value": f"{round(slope, 1)}° inclination",
            "contribution": 25.0,
            "severity": "HIGH" if slope < 40 else "CRITICAL"
        })
    elif slope >= 15:
        factors.append({
            "factor_name": "Moderate Slope Angle",
            "factor_value": f"{round(slope, 1)}° inclination",
            "contribution": 15.0,
            "severity": "MODERATE"
        })

    # 3. River Proximity & Drainage
    river_dist = features.get('distance_to_river', 1000.0)
    if river_dist <= 300:
        factors.append({
            "factor_name": "Critical River Basin Proximity",
            "factor_value": f"{int(river_dist)} m from stream",
            "contribution": 20.0,
            "severity": "HIGH" if river_dist > 150 else "CRITICAL"
        })

    # 4. Population Exposure
    pop = features.get('population', 0)
    if pop >= 2000:
        factors.append({
            "factor_name": "High Population Density Exposure",
            "factor_value": f"{pop:,} residents",
            "contribution": 15.0,
            "severity": "HIGH"
        })

    # Default baseline factor if risk is low
    if not factors:
        factors.append({
            "factor_name": "Baseline Meteorological & Terrain Status",
            "factor_value": "Normal conditions",
            "contribution": 100.0,
            "severity": "LOW"
        })

    return factors

def evaluate_full_village_risk(village_data: Dict[str, Any], weather_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Execute Risk Fusion Engine, ML Inference, Explainability, and Lead-Time estimation."""
    combined_features = {
        'rainfall_1h': weather_dict.get('rainfall_1h', 5.0),
        'rainfall_3h': weather_dict.get('rainfall_3h', 12.0),
        'rainfall_6h': weather_dict.get('rainfall_6h', 25.0),
        'rainfall_12h': weather_dict.get('rainfall_12h', 45.0),
        'rainfall_24h': weather_dict.get('rainfall_24h', 65.0),
        'rainfall_72h': weather_dict.get('rainfall_72h', 90.0),
        'rainfall_intensity': weather_dict.get('rainfall_intensity', 8.0),
        'antecedent_rainfall': weather_dict.get('rainfall_72h', 90.0) - weather_dict.get('rainfall_24h', 65.0),
        'elevation': village_data.get('elevation', 1200.0),
        'slope': village_data.get('average_slope', 25.0),
        'aspect': 180.0,
        'terrain_roughness': 0.6,
        'drainage_density': 2.5,
        'distance_to_river': 250.0,
        'land_cover_code': 1,
        'historical_flood_freq': 2,
        'historical_landslide_freq': 3,
        'population': village_data.get('population', 2500)
    }

    # 1. Run ML Predictions
    flood_p = predict_flash_flood(combined_features)
    landslide_p = predict_landslide(combined_features)

    # 2. Risk Components
    r_sev = calculate_rainfall_severity(
        combined_features['rainfall_1h'], combined_features['rainfall_24h'], combined_features['rainfall_intensity']
    )
    t_risk = calculate_terrain_risk(
        combined_features['slope'], combined_features['elevation'], combined_features['terrain_roughness'], combined_features['distance_to_river']
    )
    exp_risk = round(min(combined_features['population'] / 5000.0, 1.0), 4)

    # 3. Risk Fusion (0-100 Score)
    raw_score = (
        (flood_p * RISK_WEIGHTS['flood_prob']) +
        (landslide_p * RISK_WEIGHTS['landslide_prob']) +
        (r_sev * RISK_WEIGHTS['rainfall_severity']) +
        (t_risk * RISK_WEIGHTS['terrain_risk']) +
        (exp_risk * RISK_WEIGHTS['exposure_risk'])
    ) * 100.0

    overall_score = round(float(np.clip(raw_score, 5.0, 98.0)), 1)

    # Classification
    if overall_score >= 76:
        risk_level = "CRITICAL"
    elif overall_score >= 51:
        risk_level = "HIGH"
    elif overall_score >= 26:
        risk_level = "MODERATE"
    else:
        risk_level = "LOW"

    # 4. Lead Time & Explainability
    lead_time_info = estimate_lead_time(overall_score, combined_features['rainfall_intensity'], combined_features['slope'])
    factors = generate_risk_explanation(combined_features, flood_p, landslide_p, r_sev, t_risk)

    return {
        "village_id": village_data.get('id'),
        "village_name": village_data.get('name'),
        "flood_probability": flood_p,
        "landslide_probability": landslide_p,
        "rainfall_risk": r_sev,
        "terrain_risk": t_risk,
        "historical_risk": 0.45,
        "exposure_risk": exp_risk,
        "overall_risk_score": overall_score,
        "risk_level": risk_level,
        "estimated_lead_time": lead_time_info["lead_time_minutes"],
        "lead_time_range_min": lead_time_info["range_min"],
        "lead_time_range_max": lead_time_info["range_max"],
        "confidence_score": 0.88,
        "risk_factors": factors,
        "rainfall_24h": combined_features['rainfall_24h'],
        "slope": combined_features['slope'],
        "elevation": combined_features['elevation']
    }
