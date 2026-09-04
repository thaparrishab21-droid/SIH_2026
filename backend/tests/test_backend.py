import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "OPERATIONAL"

def test_system_status():
    response = client.get("/api/admin/system-status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"

def test_get_villages():
    response = client.get("/api/villages")
    assert response.status_code == 200
    villages = response.json()
    assert len(villages) >= 10
    assert villages[0]["name"] == "Pandoh Village"

def test_village_risk_eval():
    response = client.get("/api/villages/1/risk")
    assert response.status_code == 200
    risk = response.json()
    assert "overall_risk_score" in risk
    assert "risk_factors" in risk
    assert "estimated_lead_time" in risk

def test_evacuation_intelligence():
    response = client.get("/api/evacuation/1")
    assert response.status_code == 200
    evac = response.json()
    assert evac["recommended_route"] is not None
    assert evac["recommended_route"]["safety_score"] > 0

def test_simulation_step():
    response = client.post("/api/simulation/step?step_number=5")
    assert response.status_code == 200
    data = response.json()
    assert data["current_step"] == 5
    assert data["step_data"]["step_name"] == "FLASH_FLOOD_WARNING"

def test_alerts_endpoint():
    response = client.get("/api/alerts")
    assert response.status_code == 200
    alerts = response.json()
    assert isinstance(alerts, list)

def test_model_info():
    response = client.get("/api/admin/model-info")
    assert response.status_code == 200
    info = response.json()
    assert "flash_flood_model" in info
    assert "landslide_model" in info
