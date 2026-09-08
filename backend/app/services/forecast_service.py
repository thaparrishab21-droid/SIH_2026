import numpy as np
from typing import Dict, List, Any

def calculate_future_risk_timeline(
    current_score: float,
    rainfall_24h: float,
    rainfall_intensity: float,
    slope: float,
    river_dist: float
) -> Dict[str, Any]:
    """Compute 6-horizon future risk trajectory (NOW, +30m, +60m, +90m, +120m, +180m)."""
    
    # Runoff accumulation physics coefficient
    slope_factor = max(0.8, slope / 25.0)
    river_factor = max(0.9, 1.5 - (river_dist / 1000.0))
    rain_surge_rate = (rainfall_intensity / 10.0) * slope_factor * river_factor

    horizons = [
        ("NOW", 0),
        ("+30 MIN", 30),
        ("+60 MIN", 60),
        ("+90 MIN", 90),
        ("+120 MIN", 120),
        ("+180 MIN", 180)
    ]

    timeline = []
    threshold_crossed_min = None
    scores_list = []

    for label, mins in horizons:
        # Logistic growth curve simulation for risk accumulation
        delta_rain = (rainfall_intensity * (mins / 60.0)) * 0.8
        projected_rain_accum = round(rainfall_24h + delta_rain, 1)

        # Risk score projection (0 to 100 scale)
        surge = (mins / 60.0) * rain_surge_rate * 12.5
        proj_score = float(np.clip(current_score + surge, 5.0, 98.0))
        proj_score = round(proj_score, 1)
        scores_list.append(proj_score)

        is_crossed = proj_score >= 75.0
        if is_crossed and threshold_crossed_min is None:
            threshold_crossed_min = mins if mins > 0 else 15

        timeline.append({
            "horizon_label": label,
            "minutes_ahead": mins,
            "risk_score": proj_score,
            "rainfall_accum_mm": projected_rain_accum,
            "is_threshold_crossed": is_crossed
        })

    # Calculate Escalation Rate (points per hour)
    one_hour_score = scores_list[2] # +60m
    escalation_rate = round(max(0.0, one_hour_score - current_score), 1)
    is_rapid_escalation = escalation_rate >= 20.0 or (current_score >= 60.0 and escalation_rate >= 12.0)

    return {
        "timeline": timeline,
        "escalation_rate": escalation_rate,
        "is_rapid_escalation": is_rapid_escalation,
        "threshold_crossing_minutes": threshold_crossed_min or 180
    }
