from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.domain import Shelter
from app.schemas.domain import ShelterResponse

router = APIRouter(prefix="/shelters", tags=["Emergency Shelters"])

@router.get("", response_model=List[ShelterResponse])
def get_shelters(db: Session = Depends(get_db)):
    shelters = db.query(Shelter).all()
    res = []
    for s in shelters:
        rem = max(0, s.capacity - s.current_occupancy)
        res.append(ShelterResponse(
            id=s.id,
            name=s.name,
            village_id=s.village_id,
            latitude=s.latitude,
            longitude=s.longitude,
            capacity=s.capacity,
            current_occupancy=s.current_occupancy,
            remaining_capacity=rem,
            status=s.status
        ))
    return res

@router.get("/{shelter_id}", response_model=ShelterResponse)
def get_shelter(shelter_id: int, db: Session = Depends(get_db)):
    s = db.query(Shelter).filter(Shelter.id == shelter_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Shelter not found")
    rem = max(0, s.capacity - s.current_occupancy)
    return ShelterResponse(
        id=s.id,
        name=s.name,
        village_id=s.village_id,
        latitude=s.latitude,
        longitude=s.longitude,
        capacity=s.capacity,
        current_occupancy=s.current_occupancy,
        remaining_capacity=rem,
        status=s.status
    )
