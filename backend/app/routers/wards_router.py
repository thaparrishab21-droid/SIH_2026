from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.db_models import Ward, SensorReading, RiskAssessment, HistoricalIncident, Alert
from backend.app.schemas.api_schemas import WardOut, WardDetailOut, SensorReadingOut, SimulateReadingInput
from backend.app.services.risk_engine import calculate_risk
from backend.app.services.safe_zone_service import get_nearest_safe_zone
from backend.app.services.pdf_service import generate_ward_pdf_report

router = APIRouter(prefix="/wards", tags=["Wards & Telemetry"])

@router.get("", response_model=List[WardOut])
def get_wards(district: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Ward)
    if district:
        query = query.filter(Ward.district.ilike(f"%{district}%"))
    wards = query.all()

    results = []
    for w in wards:
        latest_reading = db.query(SensorReading).filter(SensorReading.ward_id == w.id).order_by(SensorReading.timestamp.desc()).first()
        risk_info = calculate_risk(latest_reading, w) if latest_reading else {"risk_level": "Safe", "risk_score": 0.0}
        sz_info = get_nearest_safe_zone(w.latitude, w.longitude, db, w.district)

        results.append(WardOut(
            id=w.id,
            name=w.name,
            district=w.district,
            state=w.state,
            population=w.population,
            latitude=w.latitude,
            longitude=w.longitude,
            safe_zone_name=w.safe_zone_name,
            current_risk_level=risk_info["risk_level"],
            current_risk_score=risk_info["risk_score"],
            nearest_safe_zone=sz_info
        ))
    return results

@router.get("/{ward_id}", response_model=WardDetailOut)
def get_ward_detail(ward_id: int, db: Session = Depends(get_db)):
    ward = db.query(Ward).filter(Ward.id == ward_id).first()
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")

    latest_reading = db.query(SensorReading).filter(SensorReading.ward_id == ward.id).order_by(SensorReading.timestamp.desc()).first()
    latest_risk_eval = calculate_risk(latest_reading, ward) if latest_reading else None

    latest_risk_obj = None
    if latest_risk_eval:
        latest_risk_obj = {
            "id": 0,
            "ward_id": ward.id,
            "timestamp": latest_reading.timestamp if latest_reading else None,
            "risk_level": latest_risk_eval["risk_level"],
            "risk_score": latest_risk_eval["risk_score"],
            "contributing_factors": latest_risk_eval["contributing_factors"]
        }

    incidents = db.query(HistoricalIncident).filter(HistoricalIncident.ward_id == ward.id).all()
    sz_info = get_nearest_safe_zone(ward.latitude, ward.longitude, db, ward.district)

    return WardDetailOut(
        id=ward.id,
        name=ward.name,
        district=ward.district,
        state=ward.state,
        population=ward.population,
        latitude=ward.latitude,
        longitude=ward.longitude,
        safe_zone_name=ward.safe_zone_name,
        current_risk_level=latest_risk_eval["risk_level"] if latest_risk_eval else "Safe",
        current_risk_score=latest_risk_eval["risk_score"] if latest_risk_eval else 0.0,
        latest_reading=latest_reading,
        latest_risk=latest_risk_obj,
        incidents=incidents,
        subscribers=ward.subscribers,
        nearest_safe_zone=sz_info
    )

@router.get("/{ward_id}/readings", response_model=List[SensorReadingOut])
def get_ward_readings(ward_id: int, limit: int = 72, db: Session = Depends(get_db)):
    readings = db.query(SensorReading).filter(SensorReading.ward_id == ward_id).order_by(SensorReading.timestamp.desc()).limit(limit).all()
    return list(reversed(readings))

from backend.app.services.auth_service import require_official_role

@router.post("/{ward_id}/simulate-reading")
def simulate_reading(ward_id: int, input_data: SimulateReadingInput, db: Session = Depends(get_db), current_user = Depends(require_official_role)):
    ward = db.query(Ward).filter(Ward.id == ward_id).first()
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")

    last = db.query(SensorReading).filter(SensorReading.ward_id == ward_id).order_by(SensorReading.timestamp.desc()).first()

    r1 = input_data.rainfall_1h_mm if input_data.rainfall_1h_mm is not None else (last.rainfall_1h_mm if last else 5.0)
    r24 = input_data.rainfall_24h_mm if input_data.rainfall_24h_mm is not None else (last.rainfall_24h_mm if last else 45.0)
    r72 = input_data.rainfall_72h_mm if input_data.rainfall_72h_mm is not None else (last.rainfall_72h_mm if last else 110.0)
    sm = input_data.soil_moisture_pct if input_data.soil_moisture_pct is not None else (last.soil_moisture_pct if last else 60.0)
    slope = input_data.slope_angle_deg if input_data.slope_angle_deg is not None else (last.slope_angle_deg if last else 30.0)

    reading = SensorReading(
        ward_id=ward_id,
        rainfall_1h_mm=r1,
        rainfall_24h_mm=r24,
        rainfall_72h_mm=r72,
        soil_moisture_pct=sm,
        slope_angle_deg=slope
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)

    risk_info = calculate_risk(reading, ward)

    return {
        "id": reading.id,
        "ward_id": reading.ward_id,
        "rainfall_1h_mm": reading.rainfall_1h_mm,
        "rainfall_24h_mm": reading.rainfall_24h_mm,
        "rainfall_72h_mm": reading.rainfall_72h_mm,
        "soil_moisture_pct": reading.soil_moisture_pct,
        "slope_angle_deg": reading.slope_angle_deg,
        "timestamp": reading.timestamp,
        "new_risk_level": risk_info["risk_level"],
        "risk_score": risk_info["risk_score"],
        "contributing_factors": risk_info["contributing_factors"]
    }

@router.get("/{ward_id}/report")
@router.get("/{ward_id}/report.pdf")
def get_ward_pdf_report(ward_id: int, db: Session = Depends(get_db)):
    ward = db.query(Ward).filter(Ward.id == ward_id).first()
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")

    latest_reading = db.query(SensorReading).filter(SensorReading.ward_id == ward.id).order_by(SensorReading.timestamp.desc()).first()
    latest_risk_eval = calculate_risk(latest_reading, ward) if latest_reading else None

    class RiskObj:
        def __init__(self, lvl, score, factors):
            self.risk_level = lvl
            self.risk_score = score
            self.contributing_factors = factors

    latest_risk = RiskObj(latest_risk_eval["risk_level"], latest_risk_eval["risk_score"], latest_risk_eval["contributing_factors"]) if latest_risk_eval else None
    incidents = db.query(HistoricalIncident).filter(HistoricalIncident.ward_id == ward.id).all()
    alerts = db.query(Alert).filter(Alert.ward_id == ward.id).all()
    sz_info = get_nearest_safe_zone(ward.latitude, ward.longitude, db, ward.district)

    pdf_bytes = generate_ward_pdf_report(ward, latest_reading, latest_risk, incidents, alerts, sz_info)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=Ward_{ward.id}_Hazard_Report.pdf"}
    )

from backend.app.models.db_models import IncidentStatus
from backend.app.schemas.api_schemas import IncidentStatusActivate, IncidentStatusOut

@router.post("/{ward_id}/activate-incident", response_model=IncidentStatusOut)
def activate_incident(ward_id: int, payload: IncidentStatusActivate = IncidentStatusActivate(), db: Session = Depends(get_db), current_user = Depends(require_official_role)):
    ward = db.query(Ward).filter(Ward.id == ward_id).first()
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")

    inc_status = db.query(IncidentStatus).filter(IncidentStatus.ward_id == ward_id).first()
    if not inc_status:
        inc_status = IncidentStatus(ward_id=ward_id)
        db.add(inc_status)

    inc_status.incident_active = True
    inc_status.incident_started_at = datetime.utcnow()
    inc_status.incident_description = payload.description or f"Monsoonal hazard incident declared for {ward.name}."
    inc_status.official_who_activated_id = current_user.id
    db.commit()
    db.refresh(inc_status)

    return IncidentStatusOut(
        ward_id=inc_status.ward_id,
        incident_active=inc_status.incident_active,
        incident_started_at=inc_status.incident_started_at,
        incident_description=inc_status.incident_description,
        official_who_activated=current_user.full_name
    )

@router.post("/{ward_id}/deactivate-incident", response_model=IncidentStatusOut)
def deactivate_incident(ward_id: int, db: Session = Depends(get_db), current_user = Depends(require_official_role)):
    ward = db.query(Ward).filter(Ward.id == ward_id).first()
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")

    inc_status = db.query(IncidentStatus).filter(IncidentStatus.ward_id == ward_id).first()
    if not inc_status:
        inc_status = IncidentStatus(ward_id=ward_id)
        db.add(inc_status)

    inc_status.incident_active = False
    inc_status.incident_started_at = None
    inc_status.incident_description = None
    inc_status.official_who_activated_id = None
    db.commit()
    db.refresh(inc_status)

    return IncidentStatusOut(
        ward_id=inc_status.ward_id,
        incident_active=False,
        incident_started_at=None,
        incident_description=None,
        official_who_activated=None
    )
