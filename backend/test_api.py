import sys
import os

file_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(file_dir)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import Base, engine
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

    print("\n--- 9. Testing Post-Disaster Relief & Community Support Endpoints ---")
    # Test A: GET /donation-links
    res_donations = client.get("/donation-links")
    assert res_donations.status_code == 200
    donations = res_donations.json()
    assert len(donations) >= 3
    print(f"[OK] GET /donation-links Passed: {len(donations)} curated third-party donation funds available.")

    # Test B: GET /wards/1/relief-status (Public view -> Phone numbers masked)
    res_relief = client.get("/wards/1/relief-status")
    assert res_relief.status_code == 200
    relief_data = res_relief.json()
    assert relief_data["incident_status"]["incident_active"] is True
    assert len(relief_data["relief_requests"]) >= 3
    public_req = relief_data["relief_requests"][0]
    assert "*" in public_req["requester_phone"], "Public requester phone MUST be masked for privacy"
    print(f"[OK] GET /wards/1/relief-status Passed: Active incident verified. Requester phone masked for public ({public_req['requester_phone']}).")

    # Test C: GET /wards/1/relief-status (Official authenticated view -> Phone numbers unmasked)
    res_relief_off = client.get("/wards/1/relief-status", headers={"Authorization": f"Bearer {official_token}"})
    assert res_relief_off.status_code == 200
    off_relief_data = res_relief_off.json()
    official_req = off_relief_data["relief_requests"][0]
    assert "*" not in official_req["requester_phone"], "Official viewer MUST see unmasked requester phone number"
    print(f"[OK] Authenticated Official Relief View Passed: Unmasked requester phone accessible ({official_req['requester_phone']}).")

    # Test D: Public submission of Relief Request (No auth needed)
    new_req_input = {
        "ward_id": 1,
        "requester_name": "Villager Harish Chandra",
        "requester_phone": "+919876599999",
        "need_type": "shelter",
        "description": "Family of 4 needs emergency dry shelter kits after roof damage.",
        "people_affected_count": 4,
        "urgency": "high"
    }
    res_post_req = client.post("/relief-requests", json=new_req_input)
    assert res_post_req.status_code == 200
    created_req = res_post_req.json()
    assert created_req["status"] == "open"
    assert created_req["requester_name"] == "Villager Harish Chandra"
    print(f"[OK] Public POST /relief-requests Passed: Successfully submitted need request ID {created_req['id']} without login.")

    # Test E: Public registration of Relief Provider
    new_prov_input = {
        "name": "Chamoli Local Disaster Relief Group",
        "type": "ngo",
        "phone": "+919811122233",
        "what_they_can_offer": "30 tents and emergency cooking stoves",
        "ward_ids_covered": "1,2,3"
    }
    res_post_prov = client.post("/relief-providers", json=new_prov_input)
    assert res_post_prov.status_code == 200
    created_prov = res_post_prov.json()
    assert created_prov["verified"] is False, "New public provider registration MUST start as unverified"
    print(f"[OK] Public POST /relief-providers Passed: Helper registered (ID {created_prov['id']}, Verified: False).")

    # Test F: Official verifies Relief Provider
    res_verify = client.patch(
        f"/relief-providers/{created_prov['id']}/verify",
        headers={"Authorization": f"Bearer {official_token}"}
    )
    assert res_verify.status_code == 200
    verified_prov = res_verify.json()
    assert verified_prov["verified"] is True
    print(f"[OK] Official PATCH /relief-providers/{created_prov['id']}/verify Passed: Provider marked verified.")

    # Test G: Official activates & deactivates incident for Ward 2
    res_act = client.post(
        "/wards/2/activate-incident",
        json={"description": "Test Cloudburst incident declared for Guptkashi Hill Ward"},
        headers={"Authorization": f"Bearer {official_token}"}
    )
    assert res_act.status_code == 200
    assert res_act.json()["incident_active"] is True

    res_deact = client.post(
        "/wards/2/deactivate-incident",
        headers={"Authorization": f"Bearer {official_token}"}
    )
    assert res_deact.status_code == 200
    assert res_deact.json()["incident_active"] is False
    print("[OK] Official Activate & Deactivate Incident Endpoints Passed.")

    print("\n--- 10. Testing POST /location-risk ('Check This Location' Feature) ---")
    # Test 10A: Near an existing ward (Kedarnath Town Ward ~30.7346, 79.0669) -> Expect is_estimated == False
    res_near = client.post("/location-risk", json={
        "latitude": 30.7346,
        "longitude": 79.0669
    })
    assert res_near.status_code == 200, f"Location risk near ward failed: {res_near.text}"
    near_data = res_near.json()
    assert near_data["is_estimated"] is False, "Location within 5km of seeded ward MUST have is_estimated == False"
    assert near_data["nearest_ward_name"] == "Kedarnath Town Ward"
    assert near_data["distance_to_nearest_ward_km"] <= 5.0
    assert "danger_factor" in near_data and "safety_factor" in near_data
    assert "nearest_safe_zone" in near_data
    print(f"[OK] Near-Ward Location Risk Passed: {near_data['location_name']} -> Danger: {near_data['danger_factor']}, Safety: {near_data['safety_factor']} (Nearest: {near_data['nearest_ward_name']}, {near_data['distance_to_nearest_ward_km']}km, Estimated: {near_data['is_estimated']})")

    # Test 10B: Far from any seeded ward (Rishikesh/Dehradun region ~30.1030, 78.2940) -> Expect is_estimated == True & IDW interpolation
    res_far = client.post("/location-risk", json={
        "latitude": 30.1030,
        "longitude": 78.2940
    })
    assert res_far.status_code == 200, f"Location risk far from ward failed: {res_far.text}"
    far_data = res_far.json()
    assert far_data["is_estimated"] is True, "Location > 5km from any ward MUST have is_estimated == True"
    assert far_data["distance_to_nearest_ward_km"] > 5.0
    assert any("Estimated" in f for f in far_data["contributing_factors"])
    print(f"[OK] Far Location Risk (Interpolated) Passed: {far_data['location_name']} -> Danger: {far_data['danger_factor']}, Safety: {far_data['safety_factor']} (Estimated: {far_data['is_estimated']})")

    # Test 10C: Address input (Kedarnath Dham)
    res_addr = client.post("/location-risk", json={
        "address": "Kedarnath, Uttarakhand"
    })
    assert res_addr.status_code == 200, f"Address location risk failed: {res_addr.text}"
    addr_data = res_addr.json()
    assert "danger_factor" in addr_data and "risk_level" in addr_data
    print(f"[OK] Address Geocoding Location Risk Passed: '{addr_data['location_name']}' -> Risk: {addr_data['risk_level']}")

    # Test 10D: Invalid input (empty address and missing coords) -> Expect 400
    res_invalid = client.post("/location-risk", json={})
    assert res_invalid.status_code == 400
    print("[OK] Invalid Location Input Gracefully Handled (400 Bad Request)")


    print("\n==========================================")
    print("ALL API & RBAC TESTS PASSED SUCCESSFULLY!")
    print("==========================================")

if __name__ == "__main__":
    run_tests()

