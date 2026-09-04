from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.domain import Alert, Village
from app.schemas.domain import AlertResponse, AlertCreate
from app.services.simulation_service import simulation_manager

router = APIRouter(prefix="/alerts", tags=["Alert System"])

@router.get("", response_model=List[AlertResponse])
def get_alerts(db: Session = Depends(get_db)):
    sim_status = simulation_manager.get_status()
    step_data = sim_status["step_data"]
    step_num = sim_status["current_step"]

    # Dynamic alerts generated during simulation progression
    alerts_list = []

    if step_num >= 5:
        alerts_list.append(AlertResponse(
            id=101,
            village_id=1,
            village_name="Pandoh Village",
            severity="CRITICAL",
            title="🚨 FLASH FLOOD EMERGENCY WARNING",
            message="Extreme catchment rainfall detected near Pandoh Dam basin. Flood probability 91%. Risk Score 88/100.",
            recommended_action="Initiate immediate evacuation of lower Pandoh basin toward Pandoh Senior Secondary School.",
            created_at=datetime.utcnow() - timedelta(minutes=5),
            status="ACTIVE"
        ))
        alerts_list.append(AlertResponse(
            id=102,
            village_id=2,
            village_name="Aut Village",
            severity="CRITICAL",
            title="🚨 CRITICAL FLASH FLOOD & LANDSLIDE ALERT",
            message="Severe mountain torrent runoff and unstable slope slump near Aut gorge. Lead time ~25 minutes.",
            recommended_action="Move immediately via Highland Bypass to Aut Indoor Stadium Relief Facility.",
            created_at=datetime.utcnow() - timedelta(minutes=8),
            status="ACTIVE"
        ))

    if step_num >= 3:
        alerts_list.append(AlertResponse(
            id=103,
            village_id=3,
            village_name="Bali Chowki",
            severity="WARNING",
            title="🟠 HIGH LANDSLIDE SUSCEPTIBILITY WATCH",
            message="Torrents accelerating down 45° steep slopes. Soil saturation index 82%.",
            recommended_action="Prepare emergency go-bags and identify nearest high-ground relief shelter.",
            created_at=datetime.utcnow() - timedelta(minutes=25),
            status="ACTIVE"
        ))

    if step_num >= 2:
        alerts_list.append(AlertResponse(
            id=104,
            village_id=8,
            village_name="Hanogi",
            severity="ADVISORY",
            title="🟡 HEAVY RAINFALL ADVISORY",
            message="Continuous rainfall accumulation reaching 55 mm/24h across Beas river catchment.",
            recommended_action="Monitor emergency broadcasts and avoid riverbank approach roads.",
            created_at=datetime.utcnow() - timedelta(minutes=45),
            status="ACTIVE"
        ))

    # Also fetch any saved DB alerts
    db_alerts = db.query(Alert).filter(Alert.status == "ACTIVE").all()
    for a in db_alerts:
        v = db.query(Village).filter(Village.id == a.village_id).first()
        alerts_list.append(AlertResponse(
            id=a.id,
            village_id=a.village_id,
            village_name=v.name if v else "Regional",
            severity=a.severity,
            title=a.title,
            message=a.message,
            recommended_action=a.recommended_action,
            created_at=a.created_at,
            status=a.status
        ))

    return alerts_list

@router.post("", response_model=AlertResponse)
def create_alert(alert_in: AlertCreate, db: Session = Depends(get_db)):
    village = db.query(Village).filter(Village.id == alert_in.village_id).first()
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")

    alert = Alert(
        village_id=alert_in.village_id,
        severity=alert_in.severity,
        title=alert_in.title,
        message=alert_in.message,
        recommended_action=alert_in.recommended_action,
        created_at=datetime.utcnow(),
        status="ACTIVE"
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    return AlertResponse(
        id=alert.id,
        village_id=alert.village_id,
        village_name=village.name,
        severity=alert.severity,
        title=alert.title,
        message=alert.message,
        recommended_action=alert.recommended_action,
        created_at=alert.created_at,
        status=alert.status
    )
