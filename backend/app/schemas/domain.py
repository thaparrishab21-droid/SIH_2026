from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, EmailStr

# Auth Schemas
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "CITIZEN"
    village_id: Optional[int] = None

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    village_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Village & Geography Schemas
class VillageResponse(BaseModel):
    id: int
    name: str
    state: str
    district: str
    population: int
    latitude: float
    longitude: float
    elevation: float
    average_slope: float
    flood_susceptibility: float
    landslide_susceptibility: float

    class Config:
        from_attributes = True

# Risk Factor & Prediction Schemas
class RiskFactorSchema(BaseModel):
    factor_name: str
    factor_value: str
    contribution: float
    severity: str

class VillageRiskDetail(BaseModel):
    village_id: int
    village_name: str
    flood_probability: float
    landslide_probability: float
    rainfall_risk: float
    terrain_risk: float
    historical_risk: float
    exposure_risk: float
    overall_risk_score: float
    risk_level: str
    estimated_lead_time: int
    lead_time_range_min: int
    lead_time_range_max: int
    confidence_score: float
    risk_factors: List[RiskFactorSchema]
    rainfall_24h: float
    slope: float
    elevation: float

# Alert Schemas
class AlertResponse(BaseModel):
    id: int
    village_id: int
    village_name: Optional[str] = None
    severity: str
    title: str
    message: str
    recommended_action: str
    created_at: datetime
    status: str

    class Config:
        from_attributes = True

class AlertCreate(BaseModel):
    village_id: int
    severity: str
    title: str
    message: str
    recommended_action: str

# Shelter Schemas
class ShelterResponse(BaseModel):
    id: int
    name: str
    village_id: int
    latitude: float
    longitude: float
    capacity: int
    current_occupancy: int
    remaining_capacity: int
    status: str

    class Config:
        from_attributes = True

# Evacuation Route Schemas
class EvacuationRouteSchema(BaseModel):
    id: int
    shelter_id: int
    shelter_name: str
    shelter_capacity: int
    shelter_occupancy: int
    remaining_capacity: int
    route_name: str
    route_distance: float
    estimated_time: int
    hazard_exposure: str
    safety_score: float
    route_status: str
    shelter_lat: float
    shelter_lon: float
    waypoints: List[List[float]]

class EvacuationResponse(BaseModel):
    village_id: int
    village_name: str
    risk_level: str
    overall_risk_score: float
    recommended_route: Optional[EvacuationRouteSchema] = None
    recommendation_reason: str
    all_routes: List[EvacuationRouteSchema]

# Simulation Schemas
class SimulationStatusResponse(BaseModel):
    current_step: int
    total_steps: int
    is_active: bool
    step_data: dict
