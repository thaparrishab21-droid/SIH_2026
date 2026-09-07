from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.db_models import ReliefRequest, ReliefProvider, DonationLink, IncidentStatus, Ward
from backend.app.schemas.api_schemas import (
    ReliefRequestCreate, ReliefRequestUpdate, ReliefRequestOut,
    ReliefProviderCreate, ReliefProviderOut, DonationLinkOut, WardReliefStatusOut
)
from backend.app.services.auth_service import get_current_user_optional, require_official_role

router = APIRouter(prefix="/relief", tags=["Community Relief & Charity"])

def mask_phone(phone: str) -> str:
    if not phone or len(phone) < 8:
        return "+91*****0000"
    return phone[:3] + "*****" + phone[-4:]

@router.post("/requests", response_model=ReliefRequestOut)
@router.post("/relief-requests", response_model=ReliefRequestOut)
def create_relief_request(payload: ReliefRequestCreate, db: Session = Depends(get_db)):
    if payload.honeypot_check:
        raise HTTPException(status_code=400, detail="Spam submission detected")

    ward = db.query(Ward).filter(Ward.id == payload.ward_id).first()
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")

    req = ReliefRequest(
        ward_id=payload.ward_id,
        requester_name=payload.requester_name,
        requester_phone=payload.requester_phone,
        need_type=payload.need_type,
        description=payload.description,
        people_affected_count=payload.people_affected_count,
        urgency=payload.urgency,
        status="open"
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req

@router.get("/requests", response_model=List[ReliefRequestOut])
def get_relief_requests(ward_id: Optional[int] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(ReliefRequest).filter(ReliefRequest.is_hidden == False)
    if ward_id:
        query = query.filter(ReliefRequest.ward_id == ward_id)
    if status:
        query = query.filter(ReliefRequest.status == status)
    return query.order_by(ReliefRequest.created_at.desc()).all()

@router.patch("/requests/{request_id}", response_model=ReliefRequestOut)
def update_relief_request(request_id: int, payload: ReliefRequestUpdate, db: Session = Depends(get_db)):
    req = db.query(ReliefRequest).filter(ReliefRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Relief request not found")

    if payload.status is not None:
        req.status = payload.status
        if payload.status == "fulfilled":
            req.fulfilled_at = datetime.utcnow()
    if payload.fulfilled_by_id is not None:
        req.fulfilled_by_id = payload.fulfilled_by_id
    if payload.is_hidden is not None:
        req.is_hidden = payload.is_hidden

    db.commit()
    db.refresh(req)
    return req

@router.post("/providers", response_model=ReliefProviderOut)
@router.post("/relief-providers", response_model=ReliefProviderOut)
def create_relief_provider(payload: ReliefProviderCreate, db: Session = Depends(get_db)):
    if payload.honeypot_check:
        raise HTTPException(status_code=400, detail="Spam submission detected")

    provider = ReliefProvider(
        name=payload.name,
        type=payload.type,
        phone=payload.phone,
        what_they_can_offer=payload.what_they_can_offer,
        ward_ids_covered=payload.ward_ids_covered,
        verified=False
    )
    db.add(provider)
    db.commit()
    db.refresh(provider)
    return provider

@router.get("/providers", response_model=List[ReliefProviderOut])
def get_relief_providers(ward_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(ReliefProvider).filter(ReliefProvider.is_hidden == False)
    if ward_id:
        query = query.filter(ReliefProvider.ward_ids_covered.contains(str(ward_id)))
    return query.order_by(ReliefProvider.created_at.desc()).all()

@router.patch("/providers/{provider_id}/verify", response_model=ReliefProviderOut)
@router.patch("/relief-providers/{provider_id}/verify", response_model=ReliefProviderOut)
def verify_relief_provider(provider_id: int, db: Session = Depends(get_db), current_user = Depends(require_official_role)):
    provider = db.query(ReliefProvider).filter(ReliefProvider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Relief provider not found")
    provider.verified = True
    db.commit()
    db.refresh(provider)
    return provider

@router.get("/donations", response_model=List[DonationLinkOut])
@router.get("/donation-links", response_model=List[DonationLinkOut])
def get_donation_links(ward_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(DonationLink)
    if ward_id:
        query = query.filter((DonationLink.ward_id == ward_id) | (DonationLink.ward_id == None))
    return query.all()

from backend.app.services.auth_service import get_current_user_optional, require_official_role

@router.get("/status/{ward_id}")
@router.get("/wards/{ward_id}/relief-status")
def get_ward_relief_status(ward_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user_optional)):
    ward = db.query(Ward).filter(Ward.id == ward_id).first()
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")

    inc_status = db.query(IncidentStatus).filter(IncidentStatus.ward_id == ward_id).first()
    is_active = inc_status.incident_active if inc_status else False

    requests = db.query(ReliefRequest).filter(ReliefRequest.ward_id == ward_id, ReliefRequest.is_hidden == False).all()
    open_count = len([r for r in requests if r.status == "open"])
    critical_count = len([r for r in requests if r.urgency == "critical" and r.status == "open"])

    all_providers = db.query(ReliefProvider).filter(ReliefProvider.is_hidden == False).all()
    matching_providers = [p for p in all_providers if str(ward_id) in p.ward_ids_covered.split(",")]
    verified_count = len([p for p in matching_providers if p.verified])

    donation_links = db.query(DonationLink).filter((DonationLink.ward_id == ward_id) | (DonationLink.ward_id == None)).all()

    formatted_requests = []
    is_official = current_user and current_user.role in ["official", "district_official"]

    for r in requests:
        phone = r.requester_phone if is_official else mask_phone(r.requester_phone)
        formatted_requests.append({
            "id": r.id,
            "ward_id": r.ward_id,
            "requester_name": r.requester_name,
            "requester_phone": phone,
            "need_type": r.need_type,
            "description": r.description,
            "people_affected_count": r.people_affected_count,
            "urgency": r.urgency,
            "status": r.status,
            "created_at": r.created_at,
            "fulfilled_by_id": r.fulfilled_by_id,
            "fulfilled_at": r.fulfilled_at,
            "is_hidden": r.is_hidden
        })

    return {
        "ward_id": ward.id,
        "ward_name": ward.name,
        "incident_status": {
            "incident_active": is_active,
            "incident_started_at": inc_status.incident_started_at if inc_status else None,
            "incident_description": inc_status.incident_description if inc_status else None,
        },
        "open_requests_count": open_count,
        "critical_urgency_count": critical_count,
        "verified_providers_count": verified_count,
        "relief_requests": formatted_requests,
        "relief_providers": matching_providers,
        "donation_links": donation_links
    }
