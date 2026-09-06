"""
Automated Comprehensive Test Suite for Flood-Flash FastAPI Backend (v2.0).
Tests authentication, RBAC, safe zones, PDF report exports, risk escalation, and alert dispatch.
"""

from fastapi.testclient import TestClient
from backend.main import app
from backend.database import Base, engine
from backend.seed_data import seed_database

client = TestClient(app)

def run_tests():
    print("--- 1. Resetting & Seeding Test Database ---")
    seed_database()

    print("\n--- 2. Testing /health & /system-health ---")
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[OK] Health Check Passed:", res.json())

    res_sys = client.get("/system-health")
    assert res_sys.status_code == 200, f"System health check failed: {res_sys.text}"
    sys_data = res_sys.json()
    assert sys_data["status"] == "healthy"
    assert sys_data["database_connected"] is True
    assert "data_sources" in sys_data
    res_thresh = client.get("/risk-thresholds")
    assert res_thresh.status_code == 200, f"Risk thresholds check failed: {res_thresh.text}"
    thresh_data = res_thresh.json()
    assert "critical" in thresh_data and thresh_data["critical"]["min_score"] == 82.0
    assert "warning" in thresh_data and thresh_data["warning"]["min_score"] == 60.0
    print("[OK] GET /risk-thresholds Passed: Unified single source of truth for risk levels.")

    print("\n--- 3. Testing Authentication & RBAC ---")
    # Login as Official
    login_official = client.post("/auth/login", json={"username": "admin_official", "password": "official123"})
    assert login_official.status_code == 200, f"Official login failed: {login_official.text}"
    official_data = login_official.json()
    official_token = official_data["access_token"]
    assert official_data["role"] == "district_official"
    print(f"[OK] Official Login Passed (Token acquired for {official_data['username']})")

    # Login as Viewer
    login_viewer = client.post("/auth/login", json={"username": "observer", "password": "viewer123"})
    assert login_viewer.status_code == 200, f"Viewer login failed: {login_viewer.text}"
    viewer_data = login_viewer.json()
    viewer_token = viewer_data["access_token"]
    assert viewer_data["role"] == "viewer"
    print(f"[OK] Viewer Login Passed (Token acquired for {viewer_data['username']})")

    print("\n--- 4. Testing GET /safe-zones ---")
    res = client.get("/safe-zones")
    assert res.status_code == 200, f"Get safe zones failed: {res.text}"
    safe_zones = res.json()
    assert len(safe_zones) >= 9
    print(f"[OK] GET /safe-zones Passed: {len(safe_zones)} evacuation safe zones registered.")

    print("\n--- 5. Testing GET /wards ---")
    res = client.get("/wards")
    assert res.status_code == 200, f"List wards failed: {res.text}"
    wards = res.json()
    assert len(wards) == 18
    first_ward = wards[0]
    assert "nearest_safe_zone" in first_ward
    print(f"[OK] GET /wards Passed: {len(wards)} wards. Nearest Safe Zone for {first_ward['name']}: {first_ward['nearest_safe_zone']['formatted_string']}")

    print(f"\n--- 6. Testing GET /wards/{first_ward['id']}/report (PDF Export) ---")
    res = client.get(f"/wards/{first_ward['id']}/report")
    assert res.status_code == 200, f"PDF report export failed: {res.text}"
    assert res.headers["content-type"] == "application/pdf"
    assert len(res.content) > 1000
    print(f"[OK] GET /wards/{first_ward['id']}/report Passed: Successfully generated {len(res.content)} bytes PDF document.")

    print(f"\n--- 7. Testing POST /wards/{first_ward['id']}/simulate-reading (Escalation & RBAC) ---")
    sim_input = {
        "rainfall_1h_mm": 55.0,
        "rainfall_24h_mm": 180.0,
        "rainfall_72h_mm": 240.0,
        "soil_moisture_pct": 89.0,
        "slope_angle_deg": 40.0
    }
    # Unauthenticated should fail
    res_unauth = client.post(f"/wards/{first_ward['id']}/simulate-reading", json=sim_input)
    assert res_unauth.status_code == 401, f"Expected 401 Unauthorized for unauthenticated simulate, got {res_unauth.status_code}"

    # Official token should succeed
    res = client.post(
        f"/wards/{first_ward['id']}/simulate-reading",
        json=sim_input,
        headers={"Authorization": f"Bearer {official_token}"}
    )
    assert res.status_code == 200, f"Simulate reading failed: {res.text}"
    sim_res = res.json()
    print(f"[OK] POST /wards/{first_ward['id']}/simulate-reading Passed: Level={sim_res['new_risk_level']} (Score: {sim_res['risk_score']})")

    print("\n--- 8. Testing Protected Endpoint RBAC Security (POST /alerts/trigger) ---")
    trigger_input = {
        "ward_id": first_ward['id'],
        "risk_level": "Critical",
        "custom_message": "TEST OFFICIAL BROADCAST: Immediate evacuation order."
    }

    # Case A: Unauthenticated request -> Expect 401 Unauthorized
    res_unauth = client.post("/alerts/trigger", json=trigger_input)
    assert res_unauth.status_code == 401, f"Expected 401 Unauthorized, got {res_unauth.status_code}"
    print("[OK] Unauthenticated Access Blocked (401 Unauthorized)")

    # Case B: Viewer role request -> Expect 403 Forbidden
    res_viewer = client.post(
        "/alerts/trigger",
        json=trigger_input,
        headers={"Authorization": f"Bearer {viewer_token}"}
    )
    assert res_viewer.status_code == 403, f"Expected 403 Forbidden for Viewer role, got {res_viewer.status_code}"
    print("[OK] Viewer Role Access Blocked (403 Forbidden)")

    # Case C: District Official role request -> Expect 200 OK
    res_official = client.post(
        "/alerts/trigger",
        json=trigger_input,
        headers={"Authorization": f"Bearer {official_token}"}
    )
    assert res_official.status_code == 200, f"Official alert trigger failed: {res_official.text}"
    trig_res = res_official.json()
    assert trig_res["status"] == "success"
    assert trig_res["triggered_by"] == "Officer Sharma (District Disaster Authority)"
    
    dispatch_summary = trig_res["dispatch_summary"]
    assert dispatch_summary["sms_sent"] > 0, "SMS fallback count should be > 0"
    assert dispatch_summary["total_subscribers"] == trig_res["recipient_count"]
    
    channels_sent = [r["channel"] for r in dispatch_summary["recipient_results"]]
    assert "sms" in channels_sent, "SMS channel must be present in dispatch results for opted-out subscribers"
    assert "whatsapp" in channels_sent, "WhatsApp channel must be present for opted-in subscribers"
    print(f"[OK] Official Role Access Authorized (200 OK): Dispatched to {trig_res['recipient_count']} recipients via Multi-lingual WhatsApp/SMS (WhatsApp: {dispatch_summary['whatsapp_sent']}, SMS Fallback: {dispatch_summary['sms_sent']}).")

    print("\n==========================================")
    print("ALL API & RBAC TESTS PASSED SUCCESSFULLY!")
    print("==========================================")

if __name__ == "__main__":
    run_tests()
