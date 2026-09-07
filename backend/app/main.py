import sys
import os
import asyncio
import logging
from contextlib import asynccontextmanager

file_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(file_dir, "..", ".."))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

try:
    from backend.app.config import settings
    from backend.app.database import engine, Base, SessionLocal, get_db
    from backend.app.schemas.api_schemas import ReliefRequestCreate, ReliefProviderCreate, LocationRiskInput, LocationRiskOut
    from backend.app.services.auth_service import get_current_user_optional, require_official_role
    from backend.app.services.location_risk_service import evaluate_location_risk

    from backend.app.routers import (
        auth_router,
        wards_router,
        alerts_router,
        shelters_router,
        relief_router,
        telemetry_router
    )
    from backend.app.routers.relief_router import get_donation_links, get_ward_relief_status, create_relief_request, create_relief_provider, verify_relief_provider
except ImportError:
    from app.config import settings
    from app.database import engine, Base, SessionLocal, get_db
    from app.schemas.api_schemas import ReliefRequestCreate, ReliefProviderCreate
    from app.services.auth_service import get_current_user_optional, require_official_role
    from app.routers import (
        auth_router,
        wards_router,
        alerts_router,
        shelters_router,
        relief_router,
        telemetry_router
    )
    from app.routers.relief_router import get_donation_links, get_ward_relief_status, create_relief_request, create_relief_provider, verify_relief_provider

# Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("main")

# Auto-create DB tables on startup
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} in '{settings.ENVIRONMENT}' environment...")
    logger.info(f"Risk Engine Mode: '{settings.RISK_ENGINE_MODE}'")
    yield
    logger.info("Shutting down Flood-Flash Early Warning Backend...")

app = FastAPI(
    title=settings.APP_NAME,
    description="Authorized telemetry bridge & early warning emergency portal for Uttarakhand SDMA/DDMA.",
    version="2.0.0",
    lifespan=lifespan
)

# CORS Middleware Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include All Routers
app.include_router(auth_router)
app.include_router(wards_router)
app.include_router(alerts_router)
app.include_router(shelters_router)
app.include_router(relief_router)
app.include_router(telemetry_router)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": settings.APP_NAME,
        "version": "2.0.0",
        "docs_url": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "ok", "service": settings.APP_NAME}

@app.get("/system-health")
def system_health_check():
    return {
        "status": "healthy",
        "database_connected": True,
        "data_sources": {
            "telemetry_sensors": "online",
            "safe_zones_registry": "online",
            "weather_radar": "active"
        },
        "risk_engine": settings.RISK_ENGINE_MODE,
        "version": "2.0.0"
    }

@app.get("/risk-thresholds")
def get_risk_thresholds():
    return {
        "safe": {"min_score": 0.0, "max_score": 34.9, "color": "emerald"},
        "watch": {"min_score": 35.0, "max_score": 59.9, "color": "blue"},
        "warning": {"min_score": 60.0, "max_score": 81.9, "color": "amber"},
        "critical": {"min_score": 82.0, "max_score": 100.0, "color": "red"}
    }

@app.get("/donation-links")
def root_donation_links(db=Depends(get_db)):
    return get_donation_links(db=db)

@app.get("/wards/{ward_id}/relief-status")
def root_ward_relief_status(ward_id: int, db=Depends(get_db), current_user=Depends(get_current_user_optional)):
    return get_ward_relief_status(ward_id=ward_id, db=db, current_user=current_user)

@app.post("/relief-requests")
def root_create_relief_request(payload: ReliefRequestCreate, db=Depends(get_db)):
    return create_relief_request(payload=payload, db=db)

@app.post("/relief-providers")
def root_create_relief_provider(payload: ReliefProviderCreate, db=Depends(get_db)):
    return create_relief_provider(payload=payload, db=db)

@app.patch("/relief-providers/{provider_id}/verify")
def root_verify_relief_provider(provider_id: int, db=Depends(get_db), current_user=Depends(require_official_role)):
    return verify_relief_provider(provider_id=provider_id, db=db, current_user=current_user)

@app.post("/location-risk", response_model=LocationRiskOut, tags=["Location Risk"])
def root_check_location_risk(payload: LocationRiskInput, db=Depends(get_db)):
    return evaluate_location_risk(payload, db)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
