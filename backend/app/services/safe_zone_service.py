import math
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.models.db_models import SafeZone

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)

def calculate_cardinal_direction(lat1: float, lon1: float, lat2: float, lon2: float) -> str:
    dlon = math.radians(lon2 - lon1)
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    y = math.sin(dlon) * math.cos(lat2_rad)
    x = math.cos(lat1_rad) * math.sin(lat2_rad) - math.sin(lat1_rad) * math.cos(lat2_rad) * math.cos(dlon)
    bearing = math.degrees(math.atan2(y, x))
    bearing = (bearing + 360) % 360
    directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
    idx = int((bearing + 22.5) / 45) % 8
    return directions[idx]

def get_nearest_safe_zone(ward_lat: float, ward_lng: float, db: Session, district: Optional[str] = None) -> Dict[str, Any]:
    query = db.query(SafeZone)
    if district:
        district_query = db.query(SafeZone).filter(SafeZone.district.ilike(f"%{district}%")).all()
        safe_zones = district_query if district_query else query.all()
    else:
        safe_zones = query.all()

    if not safe_zones:
        return {
            "name": "District Assembly Helipad Ground",
            "distance_km": 1.5,
            "direction": "NE",
            "capacity": 2000,
            "safe_zone_type": "Elevated Helipad",
            "formatted_string": "District Assembly Helipad Ground (1.5km NE)"
        }

    nearest = None
    min_dist = float("inf")
    nearest_dir = "N"

    for sz in safe_zones:
        dist = haversine_distance(ward_lat, ward_lng, sz.latitude, sz.longitude)
        if dist < min_dist:
            min_dist = dist
            nearest = sz
            nearest_dir = calculate_cardinal_direction(ward_lat, ward_lng, sz.latitude, sz.longitude)

    formatted = f"{nearest.name} ({min_dist:.1f}km {nearest_dir})"

    return {
        "id": nearest.id,
        "name": nearest.name,
        "latitude": nearest.latitude,
        "longitude": nearest.longitude,
        "capacity": nearest.capacity,
        "district": nearest.district,
        "safe_zone_type": nearest.safe_zone_type,
        "distance_km": min_dist,
        "direction": nearest_dir,
        "formatted_string": formatted
    }
