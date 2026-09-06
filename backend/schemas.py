from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Union

# --- User & Auth Schemas ---
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str
    full_name: str

class UserOut(BaseModel):
    id: int
    username: str
    role: str
    full_name: str
    district: Optional[str] = None

    class Config:
        from_attributes = True

# --- Safe Zone Schemas ---
class SafeZoneBase(BaseModel):
    name: str
    latitude: float
    longitude: float
    capacity: int
    district: str
    safe_zone_type: str
    associated_ward_ids: Optional[str] = None

class SafeZoneOut(SafeZoneBase):
    id: int
    distance_km: Optional[float] = None
    direction: Optional[str] = None
    formatted_string: Optional[str] = None

    class Config:
        from_attributes = True

# --- Sensor Reading ---
class SensorReadingBase(BaseModel):
    rainfall_1h_mm: float = Field(..., ge=0.0, description="1-hour rainfall in mm")
    rainfall_24h_mm: float = Field(..., ge=0.0, description="24-hour rainfall in mm")
    rainfall_72h_mm: float = Field(..., ge=0.0, description="72-hour rainfall in mm")
    soil_moisture_pct: float = Field(..., ge=0.0, le=100.0, description="Soil moisture saturation percentage")
    slope_angle_deg: float = Field(..., ge=0.0, le=90.0, description="Slope angle in degrees")

class SensorReadingCreate(SensorReadingBase):
    pass

class SensorReadingOut(SensorReadingBase):
    id: int
    ward_id: int
    timestamp: datetime

    class Config:
        from_attributes = True

# --- Risk Assessment ---
class RiskAssessmentBase(BaseModel):
    risk_level: str
    risk_score: float
    contributing_factors: Union[List[str], str]

class RiskAssessmentOut(BaseModel):
    id: int
    ward_id: int
    timestamp: datetime
    risk_level: str
    risk_score: float
    contributing_factors: List[str]

    class Config:
        from_attributes = True

# --- Historical Incident ---
class HistoricalIncidentBase(BaseModel):
    date: str
    incident_type: str
    severity: str
    casualties: int
    description: str

class HistoricalIncidentOut(HistoricalIncidentBase):
    id: int
    ward_id: int

    class Config:
        from_attributes = True

# --- Subscriber ---
class SubscriberBase(BaseModel):
    name: str
    phone_number: str
    role: str
    whatsapp_opted_in: bool = True
    preferred_language: str = "en"  # en, hi, gar

class SubscriberOut(SubscriberBase):
    id: int
    ward_id: int

    class Config:
        from_attributes = True

# --- Ward ---
class WardBase(BaseModel):
    name: str
    district: str
    state: str = "Uttarakhand"
    population: int
    latitude: float
    longitude: float
    safe_zone_name: str

class WardOut(WardBase):
    id: int
    current_risk_level: Optional[str] = "Safe"
    current_risk_score: Optional[float] = 0.0
    nearest_safe_zone: Optional[dict] = None

    class Config:
        from_attributes = True

class WardDetailOut(WardOut):
    latest_reading: Optional[SensorReadingOut] = None
    latest_risk: Optional[RiskAssessmentOut] = None
    incidents: List[HistoricalIncidentOut] = []
    subscribers: List[SubscriberOut] = []
    nearest_safe_zone: Optional[dict] = None

    class Config:
        from_attributes = True

# --- Alert ---
class AlertTriggerRequest(BaseModel):
    ward_id: int
    risk_level: Optional[str] = None
    custom_message: Optional[str] = None
    triggered_by: str = Field(default="manual (Disaster Management Official)")

class AlertOut(BaseModel):
    id: int
    ward_id: int
    timestamp: datetime
    risk_level: str
    channel: str
    message_text: str
    recipient_count: int
    delivery_status: Union[str, dict]
    triggered_by: str

    class Config:
        from_attributes = True

# --- Simulation Input ---
class SimulateReadingInput(BaseModel):
    rainfall_1h_mm: Optional[float] = None
    rainfall_24h_mm: Optional[float] = None
    rainfall_72h_mm: Optional[float] = None
    soil_moisture_pct: Optional[float] = None
    slope_angle_deg: Optional[float] = None
