from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.db_models import SafeZone
from backend.app.schemas.api_schemas import SafeZoneOut

router = APIRouter(prefix="/safe-zones", tags=["Shelters & Safe Zones"])

@router.get("", response_model=List[SafeZoneOut])
def get_safe_zones(district: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(SafeZone)
    if district:
        query = query.filter(SafeZone.district.ilike(f"%{district}%"))
    zones = query.all()
    results = []
    for sz in zones:
        results.append(SafeZoneOut(
            id=sz.id,
            name=sz.name,
            latitude=sz.latitude,
            longitude=sz.longitude,
            capacity=sz.capacity,
            district=sz.district,
            safe_zone_type=sz.safe_zone_type,
            associated_ward_ids=sz.associated_ward_ids,
            formatted_string=f"{sz.name} ({sz.safe_zone_type})"
        ))
    return results

@router.get("/{id}", response_model=SafeZoneOut)
def get_safe_zone(id: int, db: Session = Depends(get_db)):
    sz = db.query(SafeZone).filter(SafeZone.id == id).first()
    if not sz:
        raise HTTPException(status_code=404, detail="Safe zone not found")
    return SafeZoneOut(
        id=sz.id,
        name=sz.name,
        latitude=sz.latitude,
        longitude=sz.longitude,
        capacity=sz.capacity,
        district=sz.district,
        safe_zone_type=sz.safe_zone_type,
        associated_ward_ids=sz.associated_ward_ids,
        formatted_string=f"{sz.name} ({sz.safe_zone_type})"
    )
