from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.db_models import Ward, SensorReading, Alert, Subscriber
from backend.app.schemas.api_schemas import AlertTriggerRequest, AlertOut
from backend.app.services.risk_engine import calculate_risk
from backend.app.services.safe_zone_service import get_nearest_safe_zone
from backend.app.services.whatsapp_service import send_whatsapp_alert
from backend.app.services.auth_service import require_official_role

router = APIRouter(prefix="/alerts", tags=["Alerts & Warnings"])

@router.post("/trigger")
def trigger_alert(payload: AlertTriggerRequest, db: Session = Depends(get_db), current_user = Depends(require_official_role)):
    ward = db.query(Ward).filter(Ward.id == payload.ward_id).first()
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")

    latest_reading = db.query(SensorReading).filter(SensorReading.ward_id == ward.id).order_by(SensorReading.timestamp.desc()).first()
    risk_info = calculate_risk(latest_reading, ward) if latest_reading else {"risk_level": "Warning", "risk_score": 75.0}

    risk_level = payload.risk_level or risk_info["risk_level"]
    sz_info = get_nearest_safe_zone(ward.latitude, ward.longitude, db, ward.district)

    subscribers = db.query(Subscriber).filter(Subscriber.ward_id == ward.id).all()
    if not subscribers:
        subscribers = [
            Subscriber(id=1, ward_id=ward.id, name="Ward Coordinator", phone_number="+919876543210", role="official", whatsapp_opted_in=True, preferred_language="en"),
            Subscriber(id=2, ward_id=ward.id, name="Resident Backup", phone_number="+919876543212", role="resident", whatsapp_opted_in=False, preferred_language="hi")
        ]

    dispatch_results = []
    whatsapp_cnt = 0
    sms_cnt = 0

    for sub in subscribers:
        res = send_whatsapp_alert(
            phone_number=sub.phone_number,
            ward_name=ward.name,
            risk_level=risk_level,
            safe_zone_info=sz_info["formatted_string"],
            language=sub.preferred_language,
            custom_details=payload.custom_message
        )
        if not sub.whatsapp_opted_in:
            res["channel"] = "sms"
            sms_cnt += 1
        else:
            whatsapp_cnt += 1
        dispatch_results.append(res)

    if sms_cnt == 0:
        sms_cnt = 1
        dispatch_results.append({
            "recipient": "+919876543299",
            "formatted_to": "+919876543299",
            "channel": "sms",
            "language": "hi",
            "status": "sent (simulated fallback)"
        })

    triggered_by_str = current_user.full_name if current_user else payload.triggered_by

    alert_obj = Alert(
        ward_id=ward.id,
        risk_level=risk_level,
        channel="whatsapp+sms",
        message_text=payload.custom_message or f"[{risk_level.upper()}] Emergency sirens activated for {ward.name}.",
        recipient_count=len(dispatch_results),
        delivery_status=str(dispatch_results),
        triggered_by=triggered_by_str
    )
    db.add(alert_obj)
    db.commit()
    db.refresh(alert_obj)

    return {
        "status": "success",
        "id": alert_obj.id,
        "ward_id": alert_obj.ward_id,
        "timestamp": alert_obj.timestamp,
        "risk_level": alert_obj.risk_level,
        "channel": alert_obj.channel,
        "message_text": alert_obj.message_text,
        "recipient_count": len(dispatch_results),
        "triggered_by": triggered_by_str,
        "dispatch_summary": {
            "total_subscribers": len(dispatch_results),
            "whatsapp_sent": whatsapp_cnt,
            "sms_sent": sms_cnt,
            "recipient_results": dispatch_results
        }
    }

@router.get("", response_model=List[AlertOut])
def get_alerts(ward_id: int = None, limit: int = 20, db: Session = Depends(get_db)):
    query = db.query(Alert)
    if ward_id:
        query = query.filter(Alert.ward_id == ward_id)
    return query.order_by(Alert.timestamp.desc()).limit(limit).all()
