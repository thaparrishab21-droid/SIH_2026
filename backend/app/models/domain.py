from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum, Index
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="CITIZEN", nullable=False) # ADMIN, AUTHORITY, OPERATOR, CITIZEN
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    village = relationship("Village", back_populates="users")

class Region(Base):
    __tablename__ = "regions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False) # STATE, DISTRICT, BLOCK, VILLAGE, WARD
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    population = Column(Integer, default=0)

class Village(Base):
    __tablename__ = "villages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    population = Column(Integer, default=0)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    elevation = Column(Float, default=0.0)
    average_slope = Column(Float, default=0.0)
    flood_susceptibility = Column(Float, default=0.0)
    landslide_susceptibility = Column(Float, default=0.0)

    users = relationship("User", back_populates="village")
    terrain = relationship("TerrainData", back_populates="village", uselist=False)
    shelters = relationship("Shelter", back_populates="village")
    infrastructure = relationship("CriticalInfrastructure", back_populates="village")
    predictions = relationship("RiskPrediction", back_populates="village")
    alerts = relationship("Alert", back_populates="village")

class WeatherData(Base):
    __tablename__ = "weather_data"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    temperature = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    rainfall = Column(Float, nullable=False)
    wind_speed = Column(Float, nullable=False)
    weather_condition = Column(String(100), nullable=False)
    forecast_type = Column(String(50), default="CURRENT") # CURRENT, FORECAST_1H, FORECAST_6H
    source = Column(String(100), default="OpenMeteo Weather API")

class RainfallData(Base):
    __tablename__ = "rainfall_data"

    id = Column(Integer, primary_key=True, index=True)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    rainfall_1h = Column(Float, default=0.0)
    rainfall_3h = Column(Float, default=0.0)
    rainfall_6h = Column(Float, default=0.0)
    rainfall_12h = Column(Float, default=0.0)
    rainfall_24h = Column(Float, default=0.0)
    rainfall_72h = Column(Float, default=0.0)
    rainfall_intensity = Column(Float, default=0.0)
    source = Column(String(100), default="IMD / Weather Grid")

class HistoricalEvent(Base):
    __tablename__ = "historical_events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(50), nullable=False) # FLOOD, FLASH_FLOOD, LANDSLIDE
    date = Column(DateTime, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=True)
    severity = Column(String(50), nullable=False) # LOW, MODERATE, HIGH, CRITICAL
    rainfall_before_event = Column(Float, default=0.0)
    casualties = Column(Integer, default=0)
    affected_population = Column(Integer, default=0)
    description = Column(Text, nullable=True)
    source = Column(String(100), default="Disaster Record Inventory")

class TerrainData(Base):
    __tablename__ = "terrain_data"

    id = Column(Integer, primary_key=True, index=True)
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=False, unique=True)
    elevation = Column(Float, nullable=False)
    slope = Column(Float, nullable=False)
    aspect = Column(Float, default=0.0)
    terrain_roughness = Column(Float, default=0.0)
    drainage_density = Column(Float, default=0.0)
    distance_to_river = Column(Float, default=0.0)
    land_cover = Column(String(100), default="Forest/Hilly")

    village = relationship("Village", back_populates="terrain")

class River(Base):
    __tablename__ = "rivers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    river_order = Column(Integer, default=1)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    risk_level = Column(String(50), default="NORMAL") # NORMAL, MODERATE, CRITICAL

class Road(Base):
    __tablename__ = "roads"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    road_type = Column(String(50), default="State Highway")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    length = Column(Float, default=1.0) # in km
    status = Column(String(50), default="OPEN") # OPEN, AT_RISK, BLOCKED
    flood_exposure = Column(Float, default=0.0)
    landslide_exposure = Column(Float, default=0.0)

class Bridge(Base):
    __tablename__ = "bridges"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    status = Column(String(50), default="OPERATIONAL") # OPERATIONAL, VULNERABLE, DAMAGED
    vulnerability = Column(Float, default=0.0)

class Shelter(Base):
    __tablename__ = "shelters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    capacity = Column(Integer, nullable=False)
    current_occupancy = Column(Integer, default=0)
    status = Column(String(50), default="ACTIVE") # ACTIVE, FULL, CLOSED

    village = relationship("Village", back_populates="shelters")

class CriticalInfrastructure(Base):
    __tablename__ = "critical_infrastructure"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False) # HOSPITAL, SCHOOL, POLICE, FIRE_STATION, GOVERNMENT, BRIDGE, POWER, WATER
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    capacity = Column(Integer, default=100)
    vulnerability = Column(Float, default=0.0)

    village = relationship("Village", back_populates="infrastructure")

class RiskPrediction(Base):
    __tablename__ = "risk_predictions"

    id = Column(Integer, primary_key=True, index=True)
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    flood_probability = Column(Float, nullable=False) # 0.0 to 1.0
    landslide_probability = Column(Float, nullable=False) # 0.0 to 1.0
    rainfall_risk = Column(Float, nullable=False)
    terrain_risk = Column(Float, nullable=False)
    historical_risk = Column(Float, nullable=False)
    exposure_risk = Column(Float, nullable=False)
    overall_risk_score = Column(Float, nullable=False) # 0 to 100
    risk_level = Column(String(50), nullable=False) # LOW, MODERATE, HIGH, CRITICAL
    estimated_lead_time = Column(Integer, nullable=False) # in minutes
    confidence_score = Column(Float, default=0.85)

    village = relationship("Village", back_populates="predictions")
    factors = relationship("RiskFactor", back_populates="prediction", cascade="all, delete-orphan")

class RiskFactor(Base):
    __tablename__ = "risk_factors"

    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(Integer, ForeignKey("risk_predictions.id"), nullable=False)
    factor_name = Column(String(100), nullable=False)
    factor_value = Column(String(100), nullable=False)
    contribution = Column(Float, nullable=False) # percentage or weight
    severity = Column(String(50), nullable=False) # LOW, MODERATE, HIGH, CRITICAL

    prediction = relationship("RiskPrediction", back_populates="factors")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=False, index=True)
    prediction_id = Column(Integer, ForeignKey("risk_predictions.id"), nullable=True)
    severity = Column(String(50), nullable=False) # ADVISORY, WATCH, WARNING, CRITICAL
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    expires_at = Column(DateTime, nullable=True)
    status = Column(String(50), default="ACTIVE") # ACTIVE, RESOLVED, EXPIRED

    village = relationship("Village", back_populates="alerts")

class EvacuationRoute(Base):
    __tablename__ = "evacuation_routes"

    id = Column(Integer, primary_key=True, index=True)
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=False)
    shelter_id = Column(Integer, ForeignKey("shelters.id"), nullable=False)
    route_distance = Column(Float, nullable=False) # in km
    estimated_time = Column(Integer, nullable=False) # in minutes
    hazard_exposure = Column(String(50), nullable=False) # LOW, MODERATE, HIGH, CRITICAL
    safety_score = Column(Float, nullable=False) # 0 to 100
    route_status = Column(String(50), default="CLEAR") # CLEAR, AT_RISK, BLOCKED
    recommended = Column(Integer, default=1) # 1 if recommended best route, 0 otherwise
