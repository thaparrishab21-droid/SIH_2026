from typing import Dict, Any

SIMULATION_STEPS = {
    1: {
        "step_name": "NORMAL",
        "title": "Normal Baseline Weather",
        "description": "Clear skies, mild seasonal rainfall (12 mm / 24h). All river levels normal.",
        "rainfall_24h": 12.0,
        "rainfall_1h": 2.0,
        "intensity": 2.0,
        "road_status_override": "OPEN"
    },
    2: {
        "step_name": "HEAVY_RAINFALL",
        "title": "Monsoon Surge & Heavy Rain",
        "description": "Continuous rainfall accumulation (55 mm / 24h). Catchments saturating.",
        "rainfall_24h": 55.0,
        "rainfall_1h": 15.0,
        "intensity": 15.0,
        "road_status_override": "OPEN"
    },
    3: {
        "step_name": "EXTREME_RAINFALL",
        "title": "Cloudburst Incident & Extreme Rain",
        "description": "Localized heavy torrential downpour (115 mm / 24h). Flash flood potential high.",
        "rainfall_24h": 115.0,
        "rainfall_1h": 38.0,
        "intensity": 38.0,
        "road_status_override": "AT_RISK"
    },
    4: {
        "step_name": "RAPID_RISK_ESCALATION",
        "title": "Hydrological Escalation & Runoff Peak",
        "description": "Rainfall reaches 155 mm / 24h. River gauges rising rapidly. Lead time decreasing.",
        "rainfall_24h": 155.0,
        "rainfall_1h": 52.0,
        "intensity": 52.0,
        "road_status_override": "AT_RISK"
    },
    5: {
        "step_name": "FLASH_FLOOD_WARNING",
        "title": "🚨 Critical Flash Flood Warning Triggered",
        "description": "Village A & B cross 85/100 critical threshold. Automated emergency alert generated.",
        "rainfall_24h": 185.0,
        "rainfall_1h": 65.0,
        "intensity": 65.0,
        "road_status_override": "AT_RISK"
    },
    6: {
        "step_name": "LANDSLIDE_WARNING",
        "title": "🏔️ Landslide Slope Failure on Valley Highway",
        "description": "Saturated slope collapses near Highway 3. Main valley road BLOCKED.",
        "rainfall_24h": 210.0,
        "rainfall_1h": 75.0,
        "intensity": 75.0,
        "road_status_override": "BLOCKED"
    },
    7: {
        "step_name": "EVACUATION_ACTIVE",
        "title": "🛡️ Emergency Evacuation Routing Active",
        "description": "Evacuation engine redirects citizens to Safe Highland Shelter B via alternate ridge route.",
        "rainfall_24h": 210.0,
        "rainfall_1h": 70.0,
        "intensity": 70.0,
        "road_status_override": "BLOCKED"
    }
}

class SimulationState:
    def __init__(self):
        self.current_step = 1
        self.is_active = False

    def reset(self):
        self.current_step = 1
        self.is_active = False
        return self.get_status()

    def set_step(self, step_number: int) -> Dict[str, Any]:
        if step_number in SIMULATION_STEPS:
            self.current_step = step_number
            self.is_active = True
        return self.get_status()

    def next_step(self) -> Dict[str, Any]:
        if self.current_step < 7:
            self.current_step += 1
            self.is_active = True
        return self.get_status()

    def get_status(self) -> Dict[str, Any]:
        data = SIMULATION_STEPS[self.current_step]
        return {
            "current_step": self.current_step,
            "total_steps": 7,
            "is_active": self.is_active,
            "step_data": data
        }

simulation_manager = SimulationState()
