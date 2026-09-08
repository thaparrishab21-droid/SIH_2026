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

def geocode_address(address: str) -> Tuple[float, float, str]:
    """
    Geocodes an address string to (latitude, longitude, display_name) using OpenStreetMap's Nominatim API.
    Biased towards Uttarakhand / Northern India hill region.
    """
    clean_addr = address.strip()
    if not clean_addr:
        raise HTTPException(status_code=400, detail="Address string cannot be empty.")

    def query_nominatim(query_str: str) -> Optional[Dict[str, Any]]:
        params = {
            "q": query_str,
            "format": "json",
            "limit": 1,
            "addressdetails": 1,
            "viewbox": "77.5,31.5,81.1,28.5",
            "bounded": 0
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
    
    # Second attempt: append region if not already included
    if not result and "uttarakhand" not in clean_addr.lower() and "india" not in clean_addr.lower():
        result = query_nominatim(f"{clean_addr}, Uttarakhand, India")

    if not result:
        raise HTTPException(
            status_code=400,
            detail=f"Location '{address}' could not be geocoded. Please enter a valid place name in Uttarakhand or select a location directly on the map."
        )

    try:
        lat = float(result["lat"])
        lon = float(result["lon"])
        display_name = result.get("display_name", clean_addr)
        return lat, lon, display_name
    except (KeyError, ValueError):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid coordinate data received for '{address}'."
        )

def evaluate_location_risk(payload: LocationRiskInput, db: Session) -> Dict[str, Any]:
    """
    Computes danger factor, safety factor, risk level, nearest ward, and safe zone
    for an arbitrary location (via address or lat/lng).
    If distance > 5km from nearest ward, interpolates sensors and flags response as estimated.
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
            detail="The specified location is outside the supported disaster monitoring coverage region (Uttarakhand, India). Please select a location within Northern India."
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
    is_distant = min_dist > 50.0

    # Fetch fallback rainfall baseline from nearest ward sensor reading (if nearby)
    latest_reading = db.query(SensorReading).filter(
        SensorReading.ward_id == nearest_ward.id
    ).order_by(SensorReading.timestamp.desc()).first()

    if is_distant:
        # Locations > 50km from hill wards (e.g. Chandigarh, Delhi, plains): default fallback rainfall to mild clear baseline
        fb_r1 = 0.0
        fb_r24 = 0.0
        fb_r72 = 5.0
        sm_baseline = 30.0
        slope_baseline = 3.0
    else:
        fb_r1 = getattr(latest_reading, "rainfall_1h_mm", 0.0) if latest_reading else 0.0
        fb_r24 = getattr(latest_reading, "rainfall_24h_mm", 0.0) if latest_reading else 0.0
        fb_r72 = getattr(latest_reading, "rainfall_72h_mm", 0.0) if latest_reading else 0.0
        sm_baseline = getattr(latest_reading, "soil_moisture_pct", 30.0) if latest_reading else 30.0
        slope_baseline = getattr(latest_reading, "slope_angle_deg", getattr(nearest_ward, "slope_angle_deg", 30.0)) if latest_reading else 30.0

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

        sm_interp = sum(w * rw[0].soil_moisture_pct for w, rw in zip(weights, readings_and_wards)) / sum_w
        c_interp = sum(w * getattr(rw[1], "soil_cohesion_kpa", 12.0) for w, rw in zip(weights, readings_and_wards)) / sum_w
        phi_interp = sum(w * getattr(rw[1], "soil_friction_angle_deg", 30.0) for w, rw in zip(weights, readings_and_wards)) / sum_w
        gamma_interp = sum(w * getattr(rw[1], "soil_unit_weight_kn_m3", 19.0) for w, rw in zip(weights, readings_and_wards)) / sum_w

        if is_distant:
            # Locations > 50km away (plains / distant cities like Chandigarh): slope is flat (3°)
            slope_interp = 3.0
            sm_interp = min(sm_interp, 45.0)
        else:
            slope_interp = sum(w * getattr(rw[0], "slope_angle_deg", 30.0) for w, rw in zip(weights, readings_and_wards)) / sum_w


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

        risk_res = calculate_risk(InterpReading(), InterpWard())

        # Prepend explicit estimated note
        risk_res["contributing_factors"] = [
            "Estimated — no direct sensor coverage at this location (soil/slope interpolated from 3 nearest sensor stations)."
        ] + risk_res["contributing_factors"]

    # Prepend clear data source provenance log to contributing factors
    provenance_notes = []
    if is_real:
        provenance_notes.append(f"Rainfall Data: Real near-real-time / forecast sources used ({', '.join(sources_used)})")
    else:
        provenance_notes.append("Rainfall Data: Simulated fallback (APIs unconfigured or offline)")
    provenance_notes.append("Soil Moisture & Slope: Simulated from ward baseline (ground soil sensor network unavailable)")

    risk_res["contributing_factors"] = provenance_notes + risk_res["contributing_factors"]

    danger_factor = float(risk_res["risk_score"])
    fos = risk_res.get("factor_of_safety")
    safety_factor = float(fos) if fos is not None else round(max(0.0, 100.0 - danger_factor), 1)

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

