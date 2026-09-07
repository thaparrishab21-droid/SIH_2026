from backend.app.routers.auth_router import router as auth_router
from backend.app.routers.wards_router import router as wards_router
from backend.app.routers.alerts_router import router as alerts_router
from backend.app.routers.shelters_router import router as shelters_router
from backend.app.routers.relief_router import router as relief_router
from backend.app.routers.telemetry_router import router as telemetry_router

__all__ = [
    "auth_router",
    "wards_router",
    "alerts_router",
    "shelters_router",
    "relief_router",
    "telemetry_router",
]
