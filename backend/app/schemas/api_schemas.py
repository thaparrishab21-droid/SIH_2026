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
    preferred_language: str = "en"

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
    soil_cohesion_kpa: float = Field(default=12.0, description="Estimated soil cohesion in kPa")
    soil_friction_angle_deg: float = Field(default=30.0, description="Estimated soil internal friction angle in degrees")
    soil_unit_weight_kn_m3: float = Field(default=19.0, description="Estimated soil unit weight in kN/m3")

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

# --- Incident & Relief Schemas ---
class IncidentStatusActivate(BaseModel):
    description: Optional[str] = None

class IncidentStatusOut(BaseModel):
    ward_id: int
    incident_active: bool
    incident_started_at: Optional[datetime] = None
    incident_description: Optional[str] = None
    official_who_activated: Optional[str] = None

    class Config:
        from_attributes = True

class ReliefRequestCreate(BaseModel):
    ward_id: int
    requester_name: str
    requester_phone: str
    need_type: str
    description: str
    people_affected_count: int = Field(default=1, ge=1)
    urgency: str = Field(default="medium")
    honeypot_check: Optional[str] = None

class ReliefRequestUpdate(BaseModel):
    status: Optional[str] = None
    fulfilled_by_id: Optional[int] = None
    is_hidden: Optional[bool] = None

class ReliefRequestOut(BaseModel):
    id: int
    ward_id: int
    requester_name: str
    requester_phone: str
    need_type: str
    description: str
    people_affected_count: int
    urgency: str
    status: str
    created_at: datetime
    fulfilled_by_id: Optional[int] = None
    fulfilled_at: Optional[datetime] = None
    is_hidden: bool = False

    class Config:
        from_attributes = True

class ReliefProviderCreate(BaseModel):
    name: str
    type: str
    phone: str
    what_they_can_offer: str
    ward_ids_covered: str
    honeypot_check: Optional[str] = None

class ReliefProviderOut(BaseModel):
    id: int
    name: str
    type: str
    phone: str
    what_they_can_offer: str
    ward_ids_covered: str
    verified: bool
    created_at: datetime
    is_hidden: bool = False

    class Config:
        from_attributes = True

class DonationLinkOut(BaseModel):
    id: int
    ward_id: Optional[int] = None
    organization_name: str
    organization_type: str
    donation_url: str
    description: str

    class Config:
        from_attributes = True

class WardReliefStatusOut(BaseModel):
    ward_id: int
    ward_name: str
    incident_active: bool
    open_requests_count: int
    critical_urgency_count: int
    verified_providers_count: int
    requests: List[ReliefRequestOut]
    providers: List[ReliefProviderOut]
    donation_links: List[DonationLinkOut]
