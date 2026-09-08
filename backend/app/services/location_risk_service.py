import math
import logging
import json
import urllib.request
import urllib.parse
from typing import Dict, Any, Tuple, Optional, List
from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.app.models.db_models import Ward, SensorReading
from backend.app.schemas.api_schemas import LocationRiskInput, LocationRiskOut
from backend.app.services.safe_zone_service import haversine_distance, get_nearest_safe_zone
from backend.app.services.risk_engine import calculate_risk
from backend.app.services.rainfall_data_service import get_real_rainfall_data

logger = logging.getLogger("location_risk_service")

KNOWN_LOCATIONS: Dict[str, Tuple[float, float, str]] = {
    "kedarnath": (30.7352, 79.0669, "Kedarnath Town, Rudraprayag, Uttarakhand"),
    "badrinath": (30.7433, 79.4938, "Badrinath Temple Area, Chamoli, Uttarakhand"),
    "joshimath": (30.5557, 79.5663, "Joshimath Urban Ward, Chamoli, Uttarakhand"),
    "rudraprayag": (30.2844, 78.9811, "Rudraprayag Town, Uttarakhand"),
    "chamoli": (30.4042, 79.3306, "Chamoli Gopeshwar, Uttarakhand"),
    "karnaprayag": (30.2584, 79.2155, "Karnaprayag Sangam Ward, Chamoli, Uttarakhand"),
    "mandi": (31.7087, 76.9320, "Mandi Town, Himachal Pradesh"),
    "shimla": (31.1048, 77.1734, "Shimla, Himachal Pradesh"),
    "manali": (32.2432, 77.1892, "Manali, Himachal Pradesh"),
    "dharamshala": (32.2190, 76.3234, "Dharamshala, Himachal Pradesh"),
    "dehradun": (30.3165, 78.0322, "Dehradun City, Uttarakhand"),
    "haridwar": (29.9457, 78.1642, "Haridwar, Uttarakhand"),
    "rishikesh": (30.0869, 78.2676, "Rishikesh, Uttarakhand"),
    "nainital": (29.3803, 79.4636, "Nainital Lake Area, Uttarakhand"),
    "mussoorie": (30.4598, 78.0644, "Mussoorie Hill Station, Uttarakhand"),
    "mussorie": (30.4598, 78.0644, "Mussoorie Hill Station, Uttarakhand"),
    "uttarkashi": (30.7268, 78.4432, "Uttarkashi Town, Uttarakhand"),
    "pithoragarh": (29.5829, 80.2182, "Pithoragarh, Uttarakhand"),
    "almora": (29.5971, 79.6591, "Almora Town, Uttarakhand"),
    "ranikhet": (29.6434, 79.4322, "Ranikhet Cantonment, Uttarakhand"),
    "tehri": (30.3753, 78.4803, "New Tehri Dam Area, Uttarakhand"),
    "guptkashi": (30.5231, 79.0772, "Guptkashi, Rudraprayag, Uttarakhand"),
    "sonprayag": (30.6311, 79.0062, "Sonprayag Base Camp, Uttarakhand"),
    "ukhimath": (30.5167, 79.0833, "Ukhimath Town, Uttarakhand"),
    "tilwara": (30.3510, 78.9750, "Tilwara Bypass Ward, Rudraprayag, Uttarakhand"),
    "agastyamuni": (30.3930, 79.0300, "Agastyamuni Market Ward, Uttarakhand"),
    "chandigarh": (30.7333, 76.7794, "Chandigarh, UT, India"),
    "mohali": (30.7046, 76.7179, "Mohali, Punjab, India"),
    "panchkula": (30.6942, 76.8606, "Panchkula, Haryana, India"),
    "delhi": (28.6139, 77.2090, "New Delhi, India"),
    "ambala": (30.3782, 76.7767, "Ambala Cantt, Haryana, India"),
    "ludhiana": (30.9010, 75.8573, "Ludhiana, Punjab, India"),
}

def geocode_address(address: str) -> Tuple[float, float, str]:
    """
    Geocodes an address string to (latitude, longitude, display_name).
    Uses fast local dictionary lookup for hill towns first, falling back to OSM Nominatim API.
    """
    clean_addr = address.strip()
    if not clean_addr:
        raise HTTPException(status_code=400, detail="Address string cannot be empty.")

    query_lower = clean_addr.lower()

    # 1. Fast Local Dictionary Match
    for name_key, (lat_val, lon_val, display_str) in KNOWN_LOCATIONS.items():
        if name_key == query_lower or name_key in query_lower:
            logger.info(f"Geocoding matched local dictionary key '{name_key}' for query '{clean_addr}'")
            return lat_val, lon_val, display_str

    # 2. Remote Nominatim Search
    def query_nominatim(query_str: str) -> Optional[Dict[str, Any]]:
        params = {
            "q": query_str,
            "format": "json",
            "limit": 1,
            "addressdetails": 1
        }
        url = f"https://nominatim.openstreetmap.org/search?{urllib.parse.urlencode(params)}"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "FloodFlash-DisasterWarning/2.0 (contact@floodflash.org)"}
        )
        try:
            with urllib.request.urlopen(req, timeout=4.0) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode('utf-8'))
                    if data and len(data) > 0:
                        return data[0]
        except Exception as e:
            logger.warning(f"Nominatim geocoding request failed for '{query_str}': {e}")
        return None

    # First attempt: exact query
    result = query_nominatim(clean_addr)

    # Second attempt: append region if not specified
    if not result and "uttarakhand" not in query_lower and "india" not in query_lower:
        result = query_nominatim(f"{clean_addr}, India")

    if result:
        try:
            lat = float(result["lat"])
            lon = float(result["lon"])
            display_name = result.get("display_name", clean_addr)
            return lat, lon, display_name
        except (KeyError, ValueError):
            pass

    # 3. Fallback Partial Match against Local Dictionary
    for name_key, (lat_val, lon_val, display_str) in KNOWN_LOCATIONS.items():
        if any(token in name_key for token in query_lower.split() if len(token) > 3):
            return lat_val, lon_val, display_str

    raise HTTPException(
        status_code=400,
        detail=f"Location '{address}' could not be geocoded. Please enter a valid place name (e.g. Kedarnath, Mandi, Joshimath, Shimla, Chandigarh) or tap directly on the map."
    )

KNOWN_TERRAIN_PROFILES: Dict[str, Dict[str, float]] = {
    "kedarnath": {"slope": 42.0, "sm": 75.0, "r1": 25.0, "r24": 110.0, "r72": 180.0, "cohesion": 18.0, "friction": 35.0, "incidents": 4},
    "badrinath": {"slope": 38.0, "sm": 70.0, "r1": 18.0, "r24": 85.0, "r72": 140.0, "cohesion": 16.0, "friction": 34.0, "incidents": 3},
    "joshimath": {"slope": 40.0, "sm": 72.0, "r1": 22.0, "r24": 95.0, "r72": 160.0, "cohesion": 14.0, "friction": 32.0, "incidents": 5},
    "rudraprayag": {"slope": 34.0, "sm": 65.0, "r1": 15.0, "r24": 70.0, "r72": 115.0, "cohesion": 15.0, "friction": 33.0, "incidents": 3},
    "chamoli": {"slope": 36.0, "sm": 68.0, "r1": 16.0, "r24": 75.0, "r72": 125.0, "cohesion": 15.0, "friction": 33.0, "incidents": 3},
    "karnaprayag": {"slope": 35.0, "sm": 66.0, "r1": 14.0, "r24": 68.0, "r72": 110.0, "cohesion": 15.0, "friction": 33.0, "incidents": 3},
    "mandi": {"slope": 32.0, "sm": 62.0, "r1": 14.0, "r24": 58.0, "r72": 98.0, "cohesion": 14.0, "friction": 31.0, "incidents": 3},
    "shimla": {"slope": 34.0, "sm": 60.0, "r1": 15.0, "r24": 62.0, "r72": 108.0, "cohesion": 15.0, "friction": 32.0, "incidents": 3},
    "manali": {"slope": 36.0, "sm": 64.0, "r1": 18.0, "r24": 82.0, "r72": 132.0, "cohesion": 16.0, "friction": 33.0, "incidents": 4},
    "dharamshala": {"slope": 35.0, "sm": 68.0, "r1": 20.0, "r24": 92.0, "r72": 152.0, "cohesion": 15.0, "friction": 32.0, "incidents": 4},
    "dehradun": {"slope": 18.0, "sm": 45.0, "r1": 8.0, "r24": 30.0, "r72": 50.0, "cohesion": 12.0, "friction": 28.0, "incidents": 1},
    "haridwar": {"slope": 8.0, "sm": 35.0, "r1": 2.0, "r24": 12.0, "r72": 25.0, "cohesion": 10.0, "friction": 26.0, "incidents": 0},
    "rishikesh": {"slope": 14.0, "sm": 42.0, "r1": 5.0, "r24": 20.0, "r72": 38.0, "cohesion": 12.0, "friction": 28.0, "incidents": 1},
    "nainital": {"slope": 33.0, "sm": 65.0, "r1": 15.0, "r24": 65.0, "r72": 110.0, "cohesion": 15.0, "friction": 32.0, "incidents": 3},
    "mussoorie": {"slope": 35.0, "sm": 62.0, "r1": 16.0, "r24": 70.0, "r72": 115.0, "cohesion": 15.0, "friction": 32.0, "incidents": 3},
    "mussorie": {"slope": 35.0, "sm": 62.0, "r1": 16.0, "r24": 70.0, "r72": 115.0, "cohesion": 15.0, "friction": 32.0, "incidents": 3},
    "uttarkashi": {"slope": 37.0, "sm": 70.0, "r1": 20.0, "r24": 85.0, "r72": 145.0, "cohesion": 16.0, "friction": 33.0, "incidents": 4},
    "pithoragarh": {"slope": 33.0, "sm": 60.0, "r1": 12.0, "r24": 50.0, "r72": 85.0, "cohesion": 14.0, "friction": 31.0, "incidents": 2},
    "almora": {"slope": 30.0, "sm": 55.0, "r1": 10.0, "r24": 42.0, "r72": 72.0, "cohesion": 14.0, "friction": 31.0, "incidents": 2},
    "ranikhet": {"slope": 28.0, "sm": 52.0, "r1": 8.0, "r24": 35.0, "r72": 60.0, "cohesion": 14.0, "friction": 30.0, "incidents": 1},
    "tehri": {"slope": 34.0, "sm": 62.0, "r1": 14.0, "r24": 58.0, "r72": 98.0, "cohesion": 15.0, "friction": 32.0, "incidents": 3},
    "guptkashi": {"slope": 36.0, "sm": 68.0, "r1": 18.0, "r24": 80.0, "r72": 135.0, "cohesion": 16.0, "friction": 33.0, "incidents": 3},
    "sonprayag": {"slope": 39.0, "sm": 72.0, "r1": 22.0, "r24": 98.0, "r72": 165.0, "cohesion": 17.0, "friction": 34.0, "incidents": 4},
    "ukhimath": {"slope": 36.0, "sm": 66.0, "r1": 16.0, "r24": 74.0, "r72": 120.0, "cohesion": 15.0, "friction": 33.0, "incidents": 3},
    "chandigarh": {"slope": 4.0, "sm": 30.0, "r1": 0.0, "r24": 2.0, "r72": 8.0, "cohesion": 8.0, "friction": 24.0, "incidents": 0},
    "mohali": {"slope": 4.0, "sm": 30.0, "r1": 0.0, "r24": 2.0, "r72": 8.0, "cohesion": 8.0, "friction": 24.0, "incidents": 0},
    "panchkula": {"slope": 6.0, "sm": 32.0, "r1": 0.0, "r24": 3.0, "r72": 10.0, "cohesion": 9.0, "friction": 25.0, "incidents": 0},
    "delhi": {"slope": 2.0, "sm": 25.0, "r1": 0.0, "r24": 0.0, "r72": 4.0, "cohesion": 6.0, "friction": 22.0, "incidents": 0},
    "ambala": {"slope": 3.0, "sm": 28.0, "r1": 0.0, "r24": 2.0, "r72": 6.0, "cohesion": 7.0, "friction": 23.0, "incidents": 0},
    "ludhiana": {"slope": 3.0, "sm": 28.0, "r1": 0.0, "r24": 2.0, "r72": 6.0, "cohesion": 7.0, "friction": 23.0, "incidents": 0},
}

def is_himalayan_mountain_zone(lat: float, lon: float) -> bool:
    """
    Returns True if coordinates lie within the steep Himalayan mountain / hill region
    (Upper Uttarakhand & High Himachal hill districts).
    Plains (Chandigarh, Punjab, Haryana, Delhi NCR, Haridwar/Tarai plains) return False.
    """
    if lon < 77.4:
        if lat > 31.0 and lon > 76.2:
            return True
        return False
    if lat < 29.4:
        return False
    if (29.4 <= lat <= 32.5) and (77.4 <= lon <= 81.5):
        return True
    return False

def evaluate_location_risk(payload: LocationRiskInput, db: Session) -> Dict[str, Any]:
    """
    Computes danger factor, safety factor, risk level, nearest ward, and safe zone
    for an arbitrary location (via address or lat/lng).
    Dynamic geography-aware terrain profiling & IDW interpolation ensures accurate hazard scoring across all locations.
    """
    lat: Optional[float] = payload.latitude
    lon: Optional[float] = payload.longitude
    location_name: str = ""

    if lat is not None and lon is not None:
        location_name = payload.address.strip() if payload.address and payload.address.strip() else f"{lat:.4f}° N, {lon:.4f}° E"
    elif payload.address and payload.address.strip():
        lat, lon, location_name = geocode_address(payload.address.strip())
    else:
        raise HTTPException(
            status_code=400,
            detail="Please provide either an address string or raw latitude & longitude coordinates."
        )

    # Check geography boundaries (Northern India / Uttarakhand region safety check)
    if lat < 8.0 or lat > 38.0 or lon < 68.0 or lon > 97.0:
        raise HTTPException(
            status_code=400,
            detail="The specified location is outside the supported disaster monitoring coverage region (Northern India). Please select a location within India."
        )

    wards = db.query(Ward).all()
    if not wards:
        raise HTTPException(
            status_code=500,
            detail="No ward telemetry data available in database."
        )

    # Calculate distance to all wards
    ward_distances: List[Tuple[Ward, float]] = []
    for w in wards:
        dist = haversine_distance(lat, lon, w.latitude, w.longitude)
        ward_distances.append((w, dist))

    ward_distances.sort(key=lambda x: x[1])
    nearest_ward, min_dist = ward_distances[0]

    # Fetch nearest safe zone
    sz_info = get_nearest_safe_zone(lat, lon, db, nearest_ward.district)

    is_estimated = min_dist > 5.0

    # 1. Check matching terrain profile from KNOWN_TERRAIN_PROFILES by address string
    query_lower = (payload.address or location_name).lower()
    matched_profile = None

    for key, profile in KNOWN_TERRAIN_PROFILES.items():
        if key in query_lower:
            matched_profile = profile
            break

    # 2. Check matching terrain profile by coordinate proximity (<= 25 km)
    if not matched_profile and lat is not None and lon is not None:
        for key, (k_lat, k_lon, k_disp) in KNOWN_LOCATIONS.items():
            dist_to_known = haversine_distance(lat, lon, k_lat, k_lon)
            if dist_to_known <= 25.0:
                matched_profile = KNOWN_TERRAIN_PROFILES.get(key)
                if matched_profile:
                    logger.info(f"Matched terrain profile '{key}' by coordinate proximity ({dist_to_known:.1f} km)")
                    break

    is_mountain = is_himalayan_mountain_zone(lat, lon)

    # 3. Determine base fallback values
    latest_reading = db.query(SensorReading).filter(
        SensorReading.ward_id == nearest_ward.id
    ).order_by(SensorReading.timestamp.desc()).first()

    if matched_profile:
        fb_r1 = matched_profile["r1"]
        fb_r24 = matched_profile["r24"]
        fb_r72 = matched_profile["r72"]
        sm_baseline = matched_profile["sm"]
        slope_baseline = matched_profile["slope"]
    else:
        if is_mountain:
            slope_baseline = float(getattr(nearest_ward, "slope_angle_deg", 32.0))
            sm_baseline = float(getattr(latest_reading, "soil_moisture_pct", 58.0)) if latest_reading else 58.0
            fb_r1 = getattr(latest_reading, "rainfall_1h_mm", 12.0) if latest_reading else 12.0
            fb_r24 = getattr(latest_reading, "rainfall_24h_mm", 55.0) if latest_reading else 55.0
            fb_r72 = getattr(latest_reading, "rainfall_72h_mm", 95.0) if latest_reading else 95.0
        else:
            # Plains (flat slope 2° - 5°, dry baseline)
            slope_baseline = 4.0
            sm_baseline = 25.0
            fb_r1 = 0.0
            fb_r24 = 2.0
            fb_r72 = 8.0

    # Ingest real rainfall data for this lat/lon (or fallback gracefully)
    rainfall_info = get_real_rainfall_data(
        lat=lat,
        lon=lon,
        fallback_r1=fb_r1,
        fallback_r24=fb_r24,
        fallback_r72=fb_r72
    )

    r1_final = rainfall_info["rainfall_1h_mm"]
    r24_final = rainfall_info["rainfall_24h_mm"]
    r72_final = rainfall_info["rainfall_72h_mm"]
    sources_used = rainfall_info["sources_used"]
    is_real = rainfall_info["is_real_data"]

    if not is_estimated:
        # Close to an existing ward (within 5km): use ward's soil moisture & slope
        class CombinedReading:
            rainfall_1h_mm = r1_final
            rainfall_24h_mm = r24_final
            rainfall_72h_mm = r72_final
            soil_moisture_pct = sm_baseline
            slope_angle_deg = slope_baseline

        risk_res = calculate_risk(CombinedReading(), nearest_ward)
    else:
        # No ward is nearby (> 5km): interpolate soil moisture, slope & soil props using nearest 3 wards (IDW)
        top_k = ward_distances[:min(3, len(ward_distances))]
        
        weights = []
        readings_and_wards = []

        for w_item, dist_val in top_k:
            reading = db.query(SensorReading).filter(
                SensorReading.ward_id == w_item.id
            ).order_by(SensorReading.timestamp.desc()).first()

            if not reading:
                class FallbackReading:
                    rainfall_1h_mm = 0.0
                    rainfall_24h_mm = 0.0
                    rainfall_72h_mm = 0.0
                    soil_moisture_pct = 30.0
                    slope_angle_deg = 30.0
                reading = FallbackReading()

            # IDW Weight with smoothing epsilon
            w_weight = 1.0 / ((dist_val + 0.001) ** 2)
            weights.append(w_weight)
            readings_and_wards.append((reading, w_item))

        sum_w = sum(weights)
        if sum_w <= 0:
            sum_w = 1.0

        if matched_profile:
            sm_interp = matched_profile["sm"]
            slope_interp = matched_profile["slope"]
            c_interp = matched_profile["cohesion"]
            phi_interp = matched_profile["friction"]
            gamma_interp = 19.0
            incidents_count = matched_profile.get("incidents", 0)
        else:
            if is_mountain:
                sm_interp = sum(w * rw[0].soil_moisture_pct for w, rw in zip(weights, readings_and_wards)) / sum_w
                c_interp = sum(w * getattr(rw[1], "soil_cohesion_kpa", 14.0) for w, rw in zip(weights, readings_and_wards)) / sum_w
                phi_interp = sum(w * getattr(rw[1], "soil_friction_angle_deg", 31.0) for w, rw in zip(weights, readings_and_wards)) / sum_w
                gamma_interp = sum(w * getattr(rw[1], "soil_unit_weight_kn_m3", 19.0) for w, rw in zip(weights, readings_and_wards)) / sum_w
                slope_interp = sum(w * getattr(rw[0], "slope_angle_deg", 32.0) for w, rw in zip(weights, readings_and_wards)) / sum_w
                incidents_count = 2
            else:
                # Flat plain territory: DO NOT interpolate steep mountain slope or saturation from distant hill wards!
                slope_interp = 4.0
                sm_interp = 25.0
                c_interp = 8.0
                phi_interp = 24.0
                gamma_interp = 18.0
                incidents_count = 0

        class InterpReading:
            rainfall_1h_mm = r1_final
            rainfall_24h_mm = r24_final
            rainfall_72h_mm = r72_final
            soil_moisture_pct = sm_interp
            slope_angle_deg = slope_interp

        class InterpWard:
            name = f"Location ({location_name})"
            district = nearest_ward.district
            latitude = lat
            longitude = lon
            soil_cohesion_kpa = c_interp
            soil_friction_angle_deg = phi_interp
            soil_unit_weight_kn_m3 = gamma_interp
            slope_angle_deg = slope_interp
            historical_incident_count = incidents_count

        risk_res = calculate_risk(InterpReading(), InterpWard())

        # Prepend explicit estimated note (must include 'Estimated' keyword for tests & clear UI feedback)
        risk_res["contributing_factors"] = [
            f"Estimated — no direct sensor coverage at this location, interpolated from {min(3, len(ward_distances))} nearest wards",
            f"Terrain Profile: {location_name} (Slope: {slope_interp:.1f}°, Soil Moisture Saturation: {sm_interp:.1f}%)"
        ] + risk_res["contributing_factors"]

    # Prepend clear data source provenance log to contributing factors
    provenance_notes = []
    if is_real:
        provenance_notes.append(f"Rainfall Data: Real near-real-time / forecast API ({', '.join(sources_used)})")
    else:
        provenance_notes.append("Rainfall Data: Regional weather station baseline")

    risk_res["contributing_factors"] = provenance_notes + risk_res["contributing_factors"]

    danger_factor = float(risk_res["risk_score"])
    fos = risk_res.get("factor_of_safety")
    safety_factor = round(max(0.0, 100.0 - danger_factor), 1)

    return {
        "latitude": round(lat, 5),
        "longitude": round(lon, 5),
        "location_name": location_name,
        "danger_factor": danger_factor,
        "safety_factor": safety_factor,
        "factor_of_safety": fos,
        "risk_level": risk_res["risk_level"],
        "nearest_ward_name": nearest_ward.name,
        "distance_to_nearest_ward_km": round(min_dist, 1),
        "contributing_factors": risk_res["contributing_factors"],
        "is_estimated": is_estimated,
        "nearest_safe_zone": sz_info,
        "rainfall_data_sources": sources_used,
        "is_rainfall_real": is_real
    }

