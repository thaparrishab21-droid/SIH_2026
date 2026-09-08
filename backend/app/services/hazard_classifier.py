from typing import Dict, List, Any

def classify_dominant_hazard(flood_p: float, landslide_p: float, r_sev: float, slope: float, river_dist: float) -> Dict[str, Any]:
    """Determine dominant hazard state and generate custom warning titles & authority actions."""
    is_flood_critical = flood_p >= 0.70 or (r_sev >= 0.70 and river_dist <= 400.0)
    is_landslide_critical = landslide_p >= 0.70 or (r_sev >= 0.70 and slope >= 35.0)

    if is_flood_critical and is_landslide_critical:
        dominant = "MULTI_HAZARD"
        title = "🚨 MULTI-HAZARD CRITICAL WARNING (Flood + Landslide)"
        badge_icon = "🚨"
        desc = "Severe combined threat: Extreme flash flood inundation and widespread slope failures active."
    elif is_landslide_critical:
        dominant = "LANDSLIDE"
        title = "⛰️ LANDSLIDE EMERGENCY WARNING"
        badge_icon = "⛰️"
        desc = "Saturated steep slopes experiencing severe instability and rockfall hazard."
    elif is_flood_critical:
        dominant = "FLASH_FLOOD"
        title = "🌊 FLASH FLOOD EMERGENCY ALERT"
        badge_icon = "🌊"
        desc = "Torrential river basin runoff creating rapid catchment inundation."
    else:
        dominant = "HEAVY_RAINFALL"
        title = "🌧️ HEAVY RAINFALL WEATHER WATCH"
        badge_icon = "🌧️"
        desc = "Monsoon precipitation surge accumulating across catchment basin."

    # Urgent Actions for Authorities based on dominant hazard and severity
    actions = []
    if dominant == "MULTI_HAZARD":
        actions.append("Issue immediate public emergency evacuation broadcast across river and slope corridors")
        actions.append("Dispatch NDRF / SDRF rapid response teams to highland assembly points")
        actions.append("Restrict traffic access on all valley highways and mountain passes")
        actions.append("Activate all designated emergency relief shelters and notify regional hospitals")
    elif dominant == "LANDSLIDE":
        actions.append("Restrict access to vulnerable mountain road segments and slope collapse zones")
        actions.append("Deploy heavy earth-moving equipment to strategic relief choke points")
        actions.append("Evacuate residents along 35°+ slope inclinations to highland shelters")
    elif dominant == "FLASH_FLOOD":
        actions.append("Issue urgent evacuation notice for lower river basin settlements")
        actions.append("Monitor dam spillways and automated river gauge telemetry")
        actions.append("Close low-lying river bridges and floodway approach roads")
    else:
        actions.append("Maintain 24x7 control room monitoring of precipitation radar")
        actions.append("Inspect emergency shelter readiness and stockpiled relief supplies")

    return {
        "dominant_hazard": dominant,
        "hazard_title": title,
        "badge_icon": badge_icon,
        "description": desc,
        "urgent_authority_actions": actions
    }
