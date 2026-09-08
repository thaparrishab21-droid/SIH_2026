from typing import Dict, List, Any

def assign_priority_level(score: float, lead_time_min: int, pop: int, is_rapid_escalation: bool) -> str:
    """Assign emergency triage level (PRIORITY_1 to PRIORITY_4)."""
    if score >= 76.0 and lead_time_min <= 35:
        return "PRIORITY_1"
    elif score >= 76.0 or (score >= 60.0 and is_rapid_escalation):
        return "PRIORITY_2"
    elif score >= 50.0 or is_rapid_escalation:
        return "PRIORITY_3"
    else:
        return "PRIORITY_4"

def rank_village_triage(villages_eval: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Rank villages by emergency priority triage (Priority 1 first)."""
    priority_order = {"PRIORITY_1": 1, "PRIORITY_2": 2, "PRIORITY_3": 3, "PRIORITY_4": 4}
    
    sorted_villages = sorted(
        villages_eval,
        key=lambda v: (
            priority_order.get(v.get("priority_level", "PRIORITY_4"), 4),
            -v.get("overall_risk_score", 0.0),
            v.get("estimated_lead_time", 999)
        )
    )
    return sorted_villages
