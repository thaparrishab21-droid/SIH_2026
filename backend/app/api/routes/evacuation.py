from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.domain import Village, Shelter, Road
from app.schemas.domain import EvacuationResponse
from app.services.evacuation_service import evaluate_evacuation_routes
from app.services.risk_service import evaluate_full_village_risk
from app.services.simulation_service import simulation_manager

router = APIRouter(prefix="/evacuation", tags=["Evacuation Intelligence"])

@router.get("/{village_id}", response_model=EvacuationResponse)
def get_evacuation_intelligence(village_id: int, db: Session = Depends(get_db)):
    village = db.query(Village).filter(Village.id == village_id).first()
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")

    sim_status = simulation_manager.get_status()
    sim_data = sim_status["step_data"]

    # Calculate village risk
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
    v_dict = {'id': village.id, 'name': village.name, 'elevation': village.elevation, 'average_slope': village.average_slope, 'population': village.population}
    risk_eval = evaluate_full_village_risk(v_dict, weather_dict)

    # Fetch shelters
    shelters_db = db.query(Shelter).all()
    shelters_list = []
    for s in shelters_db:
        shelters_list.append({
            'id': s.id,
            'name': s.name,
            'latitude': s.latitude,
            'longitude': s.longitude,
            'capacity': s.capacity,
            'current_occupancy': s.current_occupancy
        })

    # Fetch roads
    roads_db = db.query(Road).all()
    roads_list = [{'id': r.id, 'name': r.name, 'status': r.status} for r in roads_db]

    # Evaluate Safest Route
    route_eval = evaluate_evacuation_routes(
        village.latitude,
        village.longitude,
        risk_eval["overall_risk_score"],
        shelters_list,
        roads_list
    )

    return EvacuationResponse(
        village_id=village.id,
        village_name=village.name,
        risk_level=risk_eval["risk_level"],
        overall_risk_score=risk_eval["overall_risk_score"],
        recommended_route=route_eval["recommended_route"],
        recommendation_reason=route_eval["recommendation_reason"],
        all_routes=route_eval["all_routes"]
    )

@router.get("/{village_id}/routes")
def get_village_routes(village_id: int, db: Session = Depends(get_db)):
    return get_evacuation_intelligence(village_id, db)
