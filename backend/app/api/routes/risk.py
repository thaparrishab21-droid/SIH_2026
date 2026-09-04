from datetime import datetime, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.domain import Village
from app.services.risk_service import evaluate_full_village_risk
from app.services.simulation_service import simulation_manager

router = APIRouter(prefix="/risk", tags=["Risk Analysis & Map"])

@router.get("/map")
def get_risk_map_overview(db: Session = Depends(get_db)):
    villages = db.query(Village).all()
    sim_status = simulation_manager.get_status()
    sim_data = sim_status["step_data"]

    base_r24 = sim_data["rainfall_24h"]

    map_features = []
    total_pop_at_risk = 0
    max_risk = 0.0
    critical_count = 0
    high_count = 0

    for v in villages:
        village_r24 = base_r24 * (1.0 + (v.average_slope / 100.0))
        weather_dict = {
            'rainfall_1h': sim_data["rainfall_1h"],
            'rainfall_3h': sim_data["rainfall_1h"] * 2.2,
            'rainfall_6h': sim_data["rainfall_1h"] * 3.5,
            'rainfall_12h': sim_data["rainfall_1h"] * 5.0,
            'rainfall_24h': village_r24,
            'rainfall_72h': village_r24 + 40.0,
            'rainfall_intensity': sim_data["intensity"]
        }

        v_dict = {
            'id': v.id,
            'name': v.name,
            'elevation': v.elevation,
            'average_slope': v.average_slope,
            'population': v.population
        }

        eval_res = evaluate_full_village_risk(v_dict, weather_dict)
        
        score = eval_res["overall_risk_score"]
        if score > max_risk:
            max_risk = score
        if eval_res["risk_level"] == "CRITICAL":
            critical_count += 1
        elif eval_res["risk_level"] == "HIGH":
            high_count += 1

        pop_exposed = int(v.population * (score / 100.0) * 0.85)
        total_pop_at_risk += pop_exposed

        map_features.append({
            "id": v.id,
            "name": v.name,
            "latitude": v.latitude,
            "longitude": v.longitude,
            "elevation": v.elevation,
            "slope": v.average_slope,
            "population": v.population,
            "population_at_risk": pop_exposed,
            "flood_probability": eval_res["flood_probability"],
            "landslide_probability": eval_res["landslide_probability"],
            "overall_risk_score": score,
            "risk_level": eval_res["risk_level"],
            "estimated_lead_time": eval_res["estimated_lead_time"],
            "top_risk_factor": eval_res["risk_factors"][0]["factor_name"] if eval_res["risk_factors"] else "Baseline"
        })

    return {
        "region_name": "Mandi Hilly District",
        "simulation_step": sim_status["current_step"],
        "simulation_title": sim_data["title"],
        "max_regional_risk": max_risk,
        "critical_villages_count": critical_count,
        "high_risk_villages_count": high_count,
        "total_population_at_risk": total_pop_at_risk,
        "villages": map_features
    }

@router.get("/{village_id}")
def get_single_village_risk(village_id: int, db: Session = Depends(get_db)):
    village = db.query(Village).filter(Village.id == village_id).first()
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")

    sim_data = simulation_manager.get_status()["step_data"]
    village_r24 = sim_data["rainfall_24h"] * (1.0 + (village.average_slope / 100.0))
    
    weather_dict = {
        'rainfall_1h': sim_data["rainfall_1h"],
        'rainfall_3h': sim_data["rainfall_1h"] * 2.2,
        'rainfall_6h': sim_data["rainfall_1h"] * 3.5,
        'rainfall_12h': sim_data["rainfall_1h"] * 5.0,
        'rainfall_24h': village_r24,
        'rainfall_72h': village_r24 + 40.0,
        'rainfall_intensity': sim_data["intensity"]
    }

    v_dict = {
        'id': village.id,
        'name': village.name,
        'elevation': village.elevation,
        'average_slope': village.average_slope,
        'population': village.population
    }

    return evaluate_full_village_risk(v_dict, weather_dict)

@router.get("/{village_id}/history")
def get_village_risk_history(village_id: int, db: Session = Depends(get_db)):
    village = db.query(Village).filter(Village.id == village_id).first()
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")

    sim_data = simulation_manager.get_status()["step_data"]
    base_r = sim_data["rainfall_24h"]

    now = datetime.utcnow()
    timeline = []

    for i in range(6, -1, -1):
        t_label = (now - timedelta(hours=i)).strftime("%H:00")
        factor = max(0.2, 1.0 - (i * 0.12))
        sub_score = min(98.0, max(15.0, base_r * factor * 0.55 + (village.average_slope * 0.4)))
        timeline.append({
            "time": t_label,
            "risk_score": round(sub_score, 1),
            "rainfall_accum_mm": round(base_r * factor, 1)
        })

    return {"village_name": village.name, "timeline": timeline}
