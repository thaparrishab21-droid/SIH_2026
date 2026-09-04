from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.database import init_db
from app.db.seed import seed_database

# Import routers
from app.api.routes.auth import router as auth_router
from app.api.routes.villages import router as villages_router
from app.api.routes.weather import router as weather_router
from app.api.routes.risk import router as risk_router
from app.api.routes.alerts import router as alerts_router
from app.api.routes.shelters import router as shelters_router
from app.api.routes.evacuation import router as evacuation_router
from app.api.routes.simulation import router as simulation_router
from app.api.routes.admin import router as admin_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Powered Hyper-Local Flash Flood & Landslide Early Warning and Evacuation Intelligence Platform (SIH 100% Software System)",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()
    seed_database()

# Register API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(villages_router, prefix=settings.API_V1_STR)
app.include_router(weather_router, prefix=settings.API_V1_STR)
app.include_router(risk_router, prefix=settings.API_V1_STR)
app.include_router(alerts_router, prefix=settings.API_V1_STR)
app.include_router(shelters_router, prefix=settings.API_V1_STR)
app.include_router(evacuation_router, prefix=settings.API_V1_STR)
app.include_router(simulation_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "status": "OPERATIONAL",
        "pilot_region": "Mandi Hilly District, Himachal Pradesh",
        "documentation": "/docs"
    }
