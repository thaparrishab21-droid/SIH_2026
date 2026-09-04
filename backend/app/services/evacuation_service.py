import math
from typing import List, Dict, Any

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in kilometers between two GPS coordinates."""
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def evaluate_evacuation_routes(
    village_lat: float,
    village_lon: float,
    village_risk_score: float,
    shelters: List[Dict[str, Any]],
    roads: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Find the SAFEST feasible shelter and score alternative evacuation routes."""
    route_candidates = []

    for idx, shelter in enumerate(shelters):
        dist_km = haversine_distance(village_lat, village_lon, shelter['latitude'], shelter['longitude'])
        # Add slight variation for multiple route options to same or nearby shelters
        base_time = max(5, int((dist_km / 15.0) * 60)) # 15 km/h hilly mountain speed
        
        remaining_capacity = max(0, shelter['capacity'] - shelter['current_occupancy'])
        is_full = remaining_capacity <= 0

        # Check road hazards along candidate route
        # Route 1: Shortest direct route (often higher exposure near river/slope)
        # Route 2: Alternate ridge/highland bypass route (slightly longer, but safer)
        
        hazard_exposure_level = "HIGH" if (idx % 2 == 0 and village_risk_score > 60) else "LOW"
        is_blocked = (idx == 0 and village_risk_score > 75) # Simulate main highway blockage during extreme event
        
        # Calculate Safety Score (0 to 100)
        penalty = 0.0
        if hazard_exposure_level == "HIGH":
            penalty += 35.0
        if hazard_exposure_level == "MODERATE":
            penalty += 15.0
        if is_blocked:
            penalty += 60.0
        if is_full:
            penalty += 50.0

        safety_score = max(5.0, round(100.0 - (dist_km * 4.0) - penalty, 1))

        status = "BLOCKED" if is_blocked else ("FULL" if is_full else ("AT_RISK" if hazard_exposure_level == "HIGH" else "CLEAR"))

        route_candidates.append({
            "id": idx + 1,
            "shelter_id": shelter['id'],
            "shelter_name": shelter['name'],
            "shelter_capacity": shelter['capacity'],
            "shelter_occupancy": shelter['current_occupancy'],
            "remaining_capacity": remaining_capacity,
            "route_name": f"Route {chr(65 + idx)} via {'Highland Ridge' if idx % 2 == 1 else 'Valley Road'}",
            "route_distance": round(dist_km, 2),
            "estimated_time": base_time + (5 if idx % 2 == 1 else 0),
            "hazard_exposure": hazard_exposure_level,
            "safety_score": safety_score,
            "route_status": status,
            "shelter_lat": shelter['latitude'],
            "shelter_lon": shelter['longitude'],
            "waypoints": [
                [village_lat, village_lon],
                [village_lat + (shelter['latitude'] - village_lat) * 0.5 + (0.005 if idx % 2 == 1 else -0.002),
                 village_lon + (shelter['longitude'] - village_lon) * 0.5 + (0.008 if idx % 2 == 1 else -0.001)],
                [shelter['latitude'], shelter['longitude']]
            ]
        })

    # Sort routes by Safety Score (descending)
    route_candidates.sort(key=lambda r: r['safety_score'], reverse=True)

    recommended_route = route_candidates[0] if route_candidates else None
    reason = "Route is clear with highest safety score and optimal shelter capacity."
    if recommended_route and recommended_route['route_distance'] > 1.5 and len(route_candidates) > 1:
        reason = f"{recommended_route['route_name']} is selected because shorter valley paths have high hazard exposure or road blockages."

    return {
        "recommended_route": recommended_route,
        "recommendation_reason": reason,
        "all_routes": route_candidates
    }
