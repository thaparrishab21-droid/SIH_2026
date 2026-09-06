from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="viewer")  # district_official, viewer
    full_name = Column(String, nullable=False)
    district = Column(String, nullable=True)

class Ward(Base):
    __tablename__ = "wards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    district = Column(String, nullable=False, index=True)
    state = Column(String, nullable=False, default="Uttarakhand")
    population = Column(Integer, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    safe_zone_name = Column(String, nullable=False)

    readings = relationship("SensorReading", back_populates="ward", cascade="all, delete-orphan")
    risk_assessments = relationship("RiskAssessment", back_populates="ward", cascade="all, delete-orphan")
    incidents = relationship("HistoricalIncident", back_populates="ward", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="ward", cascade="all, delete-orphan")
    subscribers = relationship("Subscriber", back_populates="ward", cascade="all, delete-orphan")
    incident_status = relationship("IncidentStatus", back_populates="ward", uselist=False, cascade="all, delete-orphan")
    relief_requests = relationship("ReliefRequest", back_populates="ward", cascade="all, delete-orphan")
    donation_links = relationship("DonationLink", back_populates="ward", cascade="all, delete-orphan")

class SafeZone(Base):
    __tablename__ = "safe_zones"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    capacity = Column(Integer, nullable=False, default=1000)
    district = Column(String, nullable=False, index=True)
    safe_zone_type = Column(String, nullable=False, default="Community Shelter")
    associated_ward_ids = Column(String, nullable=True)  # Comma-separated ward IDs e.g. "1,2,3"

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    ward_id = Column(Integer, ForeignKey("wards.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    rainfall_1h_mm = Column(Float, nullable=False, default=0.0)
    rainfall_24h_mm = Column(Float, nullable=False, default=0.0)
    rainfall_72h_mm = Column(Float, nullable=False, default=0.0)
    soil_moisture_pct = Column(Float, nullable=False, default=0.0)
    slope_angle_deg = Column(Float, nullable=False, default=0.0)

    ward = relationship("Ward", back_populates="readings")

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(Integer, primary_key=True, index=True)
    ward_id = Column(Integer, ForeignKey("wards.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    risk_level = Column(String, nullable=False)  # Safe, Watch, Warning, Critical
    risk_score = Column(Float, nullable=False)   # 0.0 - 100.0
    contributing_factors = Column(Text, nullable=False)  # JSON or newline-separated text list

    ward = relationship("Ward", back_populates="risk_assessments")

class HistoricalIncident(Base):
    __tablename__ = "historical_incidents"

    id = Column(Integer, primary_key=True, index=True)
    ward_id = Column(Integer, ForeignKey("wards.id"), nullable=False, index=True)
    date = Column(String, nullable=False)  # YYYY-MM-DD format or ISO string
    incident_type = Column(String, nullable=False)  # landslide, flash_flood
    severity = Column(String, nullable=False)  # Low, Medium, High, Severe
    casualties = Column(Integer, nullable=False, default=0)
    description = Column(Text, nullable=False)

    ward = relationship("Ward", back_populates="incidents")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    ward_id = Column(Integer, ForeignKey("wards.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    risk_level = Column(String, nullable=False)
    channel = Column(String, nullable=False, default="whatsapp")  # whatsapp, sms, whatsapp+sms
    message_text = Column(Text, nullable=False)
    recipient_count = Column(Integer, nullable=False, default=0)
    delivery_status = Column(Text, nullable=False)  # JSON log of recipient statuses & fallback channels
    triggered_by = Column(String, nullable=False, default="auto")  # auto, manual (Official Name)

    ward = relationship("Ward", back_populates="alerts")

class Subscriber(Base):
    __tablename__ = "subscribers"

    id = Column(Integer, primary_key=True, index=True)
    ward_id = Column(Integer, ForeignKey("wards.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    phone_number = Column(String, nullable=False)  # e.g., +919876543210
    role = Column(String, nullable=False)  # official, village_head, resident
    whatsapp_opted_in = Column(Boolean, nullable=False, default=True)
    preferred_language = Column(String, nullable=False, default="en")  # en (English), hi (Hindi), gar (Garhwali)

    ward = relationship("Ward", back_populates="subscribers")

class IncidentStatus(Base):
    __tablename__ = "incident_statuses"

    id = Column(Integer, primary_key=True, index=True)
    ward_id = Column(Integer, ForeignKey("wards.id"), unique=True, nullable=False, index=True)
    incident_active = Column(Boolean, nullable=False, default=False)
    incident_started_at = Column(DateTime, nullable=True)
    incident_description = Column(Text, nullable=True)
    official_who_activated_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    ward = relationship("Ward", back_populates="incident_status")
    official_who_activated = relationship("User")

class ReliefProvider(Base):
    __tablename__ = "relief_providers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # individual, ngo, govt_agency, business
    phone = Column(String, nullable=False)
    what_they_can_offer = Column(Text, nullable=False)
    ward_ids_covered = Column(String, nullable=False)  # comma-separated ward IDs e.g. "1,2,3"
    verified = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_hidden = Column(Boolean, nullable=False, default=False)

    fulfilled_requests = relationship("ReliefRequest", back_populates="fulfilled_by")

class ReliefRequest(Base):
    __tablename__ = "relief_requests"

    id = Column(Integer, primary_key=True, index=True)
    ward_id = Column(Integer, ForeignKey("wards.id"), nullable=False, index=True)
    requester_name = Column(String, nullable=False)
    requester_phone = Column(String, nullable=False)
    need_type = Column(String, nullable=False)  # shelter, food, medical, water, clothing, rescue, other
    description = Column(Text, nullable=False)
    people_affected_count = Column(Integer, nullable=False, default=1)
    urgency = Column(String, nullable=False, default="medium")  # low, medium, high, critical
    status = Column(String, nullable=False, default="open")  # open, in_progress, fulfilled
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    fulfilled_by_id = Column(Integer, ForeignKey("relief_providers.id"), nullable=True)
    fulfilled_at = Column(DateTime, nullable=True)
    is_hidden = Column(Boolean, nullable=False, default=False)

    ward = relationship("Ward", back_populates="relief_requests")
    fulfilled_by = relationship("ReliefProvider", back_populates="fulfilled_requests")

class DonationLink(Base):
    __tablename__ = "donation_links"

    id = Column(Integer, primary_key=True, index=True)
    ward_id = Column(Integer, ForeignKey("wards.id"), nullable=True, index=True)
    organization_name = Column(String, nullable=False)
    organization_type = Column(String, nullable=False)  # e.g., State Disaster Response Fund, Verified NGO
    donation_url = Column(String, nullable=False)
    description = Column(Text, nullable=False)

    ward = relationship("Ward", back_populates="donation_links")

