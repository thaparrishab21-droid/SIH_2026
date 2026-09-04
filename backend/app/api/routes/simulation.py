from fastapi import APIRouter
from app.services.simulation_service import simulation_manager

router = APIRouter(prefix="/simulation", tags=["SIH Live Scenario Simulator"])

@router.get("/status")
def get_simulation_status():
    return simulation_manager.get_status()

@router.post("/start")
def start_simulation():
    return simulation_manager.set_step(1)

@router.post("/step")
def step_simulation(step_number: int = None):
    if step_number:
        return simulation_manager.set_step(step_number)
    return simulation_manager.next_step()

@router.post("/reset")
def reset_simulation():
    return simulation_manager.reset()
