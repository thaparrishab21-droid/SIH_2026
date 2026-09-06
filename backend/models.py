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
