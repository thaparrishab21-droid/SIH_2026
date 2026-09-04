from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.domain import Village, RainfallData
from app.schemas.domain import VillageResponse, VillageRiskDetail
from app.services.risk_service import evaluate_full_village_risk
from app.services.simulation_service import simulation_manager

router = APIRouter(prefix="/villages", tags=["Villages"])

@router.get("", response_model=List[VillageResponse])
def get_villages(db: Session = Depends(get_db)):
    villages = db.query(Village).all()
    return [VillageResponse.from_orm(v) for v in villages]

@router.get("/{village_id}", response_model=VillageResponse)
def get_village(village_id: int, db: Session = Depends(get_db)):
    village = db.query(Village).filter(Village.id == village_id).first()
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")
    return VillageResponse.from_orm(village)

@router.get("/{village_id}/risk", response_model=VillageRiskDetail)
def get_village_risk(village_id: int, db: Session = Depends(get_db)):
    village = db.query(Village).filter(Village.id == village_id).first()
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")

    sim_status = simulation_manager.get_status()
    sim_data = sim_status["step_data"]

    # Base rainfall parameters (modified dynamically during scenario simulation)
    base_r24 = sim_data["rainfall_24h"]
    # Add slight spatial variation based on elevation and slope
    village_r24 = base_r24 * (1.0 + (village.average_slope / 100.0))

    weather_dict = {
        'rainfall_1h': sim_data["rainfall_1h"],
        'rainfall_3h': sim_data["rainfall_1h"] * 2.2,
        'rainfall_6h': sim_data["rainfall_1h"] * 3.5,
        'rainfall_12h': sim_data["rainfall_1h"] * 5.0,
        'rainfall_24h': village_r24,
        'rainfall_72h': village_r24 + 40.0,
        'rainfall_intensity': sim_data["intensity"]
    }

    village_dict = {
        'id': village.id,
        'name': village.name,
        'elevation': village.elevation,
        'average_slope': village.average_slope,
        'population': village.population
    }

    risk_eval = evaluate_full_village_risk(village_dict, weather_dict)
    return risk_eval
