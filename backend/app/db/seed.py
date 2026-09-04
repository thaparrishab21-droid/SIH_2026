from datetime import datetime, timedelta
from app.db.database import SessionLocal, init_db
from app.models.domain import (
    User, Region, Village, WeatherData, RainfallData, HistoricalEvent,
    TerrainData, River, Road, Bridge, Shelter, CriticalInfrastructure,
    RiskPrediction, RiskFactor, Alert, EvacuationRoute
)
from app.utils.security import get_password_hash

def seed_database():
    print("=== Initializing MySQL Database Schema & Seeding Pilot Data ===")
    init_db()
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(Village).count() > 0:
            print("Database already contains data. Skipping re-seed.")
            return

        # 1. Regions & Villages (Mandi Hilly District Pilot)
        mandi_region = Region(
            name="Mandi District",
            state="Himachal Pradesh",
            district="Mandi",
            type="DISTRICT",
            latitude=31.7087,
            longitude=76.9320,
            population=999875
        )
        db.add(mandi_region)
        db.commit()

        villages_data = [
            {"id": 1, "name": "Pandoh Village", "pop": 2840, "lat": 31.6700, "lon": 77.0450, "elev": 920.0, "slope": 38.0},
            {"id": 2, "name": "Aut Village", "pop": 1950, "lat": 31.7450, "lon": 77.1250, "elev": 1080.0, "slope": 42.0},
            {"id": 3, "name": "Bali Chowki", "pop": 3200, "lat": 31.6200, "lon": 77.1600, "elev": 1450.0, "slope": 45.0},
            {"id": 4, "name": "Nagwain", "pop": 2100, "lat": 31.7800, "lon": 77.0900, "elev": 980.0, "slope": 22.0},
            {"id": 5, "name": "Thachi", "pop": 1420, "lat": 31.5500, "lon": 77.1800, "elev": 1820.0, "slope": 48.0},
            {"id": 6, "name": "Kotli", "pop": 2650, "lat": 31.7100, "lon": 76.8800, "elev": 1250.0, "slope": 28.0},
            {"id": 7, "name": "Baggi", "pop": 4100, "lat": 31.5800, "lon": 76.9600, "elev": 880.0, "slope": 18.0},
            {"id": 8, "name": "Hanogi", "pop": 1180, "lat": 31.7150, "lon": 77.0750, "elev": 940.0, "slope": 52.0},
            {"id": 9, "name": "Dharampur", "pop": 5400, "lat": 31.8100, "lon": 76.7600, "elev": 750.0, "slope": 15.0},
            {"id": 10, "name": "Rewalsar", "pop": 3800, "lat": 31.6300, "lon": 76.8300, "elev": 1360.0, "slope": 24.0}
        ]

        for v in villages_data:
            village_obj = Village(
                id=v["id"],
                name=v["name"],
                state="Himachal Pradesh",
                district="Mandi",
                population=v["pop"],
                latitude=v["lat"],
                longitude=v["lon"],
                elevation=v["elev"],
                average_slope=v["slope"],
                flood_susceptibility=round(0.3 + (v["slope"] / 100.0), 2),
                landslide_susceptibility=round(0.2 + (v["slope"] / 75.0), 2)
            )
            db.add(village_obj)
            
            # Terrain data
            terrain_obj = TerrainData(
                village_id=v["id"],
                elevation=v["elev"],
                slope=v["slope"],
                aspect=180.0,
                terrain_roughness=round(0.4 + (v["slope"] / 90.0), 2),
                drainage_density=2.8,
                distance_to_river=220.0 if v["id"] in [1, 2, 8] else 850.0,
                land_cover="Hilly Forest / Dense Vegetation"
            )
            db.add(terrain_obj)

        db.commit()

        # 2. Users (Admin, Authority, Operator, Citizen)
        users_data = [
            User(name="Admin User", email="admin@disaster.gov.in", password_hash=get_password_hash("admin123"), role="ADMIN"),
            User(name="District Commander", email="commander@mandi.gov.in", password_hash=get_password_hash("authority123"), role="AUTHORITY"),
            User(name="Control Room Operator", email="operator@mandi.gov.in", password_hash=get_password_hash("operator123"), role="OPERATOR"),
            User(name="Citizen Resident", email="citizen@pandoh.in", password_hash=get_password_hash("citizen123"), role="CITIZEN", village_id=1)
        ]
        db.add_all(users_data)

        # 3. Weather & Rainfall Initial Baseline
        weather = WeatherData(
            latitude=31.7087,
            longitude=76.9320,
            temperature=22.5,
            humidity=85.0,
            rainfall=15.0,
            wind_speed=12.0,
            weather_condition="Light Rain & Overcast",
            forecast_type="CURRENT",
            source="OpenMeteo Weather API"
        )
        db.add(weather)

        rainfall = RainfallData(
            region_id=1,
            rainfall_1h=3.5,
            rainfall_3h=10.0,
            rainfall_6h=22.0,
            rainfall_12h=35.0,
            rainfall_24h=52.0,
            rainfall_72h=85.0,
            rainfall_intensity=5.0,
            source="IMD Rain Grid"
        )
        db.add(rainfall)

        # 4. Shelters
        shelters_data = [
            Shelter(id=1, name="Pandoh Govt Senior Secondary School", village_id=1, latitude=31.6730, longitude=77.0490, capacity=450, current_occupancy=80, status="ACTIVE"),
            Shelter(id=2, name="Aut Community Indoor Stadium", village_id=2, latitude=31.7480, longitude=77.1290, capacity=600, current_occupancy=120, status="ACTIVE"),
            Shelter(id=3, name="Highland Relief Camp Bali Chowki", village_id=3, latitude=31.6240, longitude=77.1650, capacity=500, current_occupancy=45, status="ACTIVE"),
            Shelter(id=4, name="Baggi Govt College Complex", village_id=7, latitude=31.5830, longitude=76.9650, capacity=800, current_occupancy=150, status="ACTIVE"),
            Shelter(id=5, name="Hanogi Temple Highland Relief Facility", village_id=8, latitude=31.7190, longitude=77.0810, capacity=350, current_occupancy=25, status="ACTIVE")
        ]
        db.add_all(shelters_data)

        # 5. Critical Infrastructure
        infra_data = [
            CriticalInfrastructure(name="Pandoh Civil Hospital", type="HOSPITAL", village_id=1, latitude=31.6710, longitude=77.0460, capacity=100, vulnerability=0.35),
            CriticalInfrastructure(name="Aut Police Station", type="POLICE", village_id=2, latitude=31.7460, longitude=77.1260, capacity=50, vulnerability=0.40),
            CriticalInfrastructure(name="Hanogi Fire Station", type="FIRE_STATION", village_id=8, latitude=31.7160, longitude=77.0760, capacity=30, vulnerability=0.50),
            CriticalInfrastructure(name="Bali Chowki Govt School", type="SCHOOL", village_id=3, latitude=31.6210, longitude=77.1610, capacity=300, vulnerability=0.25)
        ]
        db.add_all(infra_data)

        # 6. Rivers, Roads, Bridges
        rivers = [
            River(name="Beas River", river_order=4, latitude=31.6800, longitude=77.0500, risk_level="MODERATE"),
            River(name="Tirthan River", river_order=3, latitude=31.6300, longitude=77.1700, risk_level="NORMAL")
        ]
        db.add_all(rivers)

        roads = [
            Road(name="NH-21 Mandi-Kullu Highway", road_type="National Highway", latitude=31.7000, longitude=77.0600, length=28.5, status="OPEN", flood_exposure=0.6, landslide_exposure=0.7),
            Road(name="Mandi-Kullu Alternate Ridge Bypass", road_type="State Highway", latitude=31.6900, longitude=77.1000, length=34.2, status="OPEN", flood_exposure=0.15, landslide_exposure=0.2)
        ]
        db.add_all(roads)

        bridges = [
            Bridge(name="Aut Beas Bridge", latitude=31.7470, longitude=77.1270, status="OPERATIONAL", vulnerability=0.3),
            Bridge(name="Pandoh Dam Spillway Bridge", latitude=31.6720, longitude=77.0470, status="OPERATIONAL", vulnerability=0.4)
        ]
        db.add_all(bridges)

        # 7. Historical Events
        hist_events = [
            HistoricalEvent(
                event_type="FLASH_FLOOD",
                date=datetime.utcnow() - timedelta(days=365),
                latitude=31.7450,
                longitude=77.1250,
                village_id=2,
                severity="HIGH",
                rainfall_before_event=145.0,
                casualties=4,
                affected_population=1200,
                description="Sudden cloudburst upstream causing severe flash flooding in Aut valley basin.",
                source="State Disaster Authority Inventory"
            ),
            HistoricalEvent(
                event_type="LANDSLIDE",
                date=datetime.utcnow() - timedelta(days=180),
                latitude=31.7150,
                longitude=77.0750,
                village_id=8,
                severity="CRITICAL",
                rainfall_before_event=180.0,
                casualties=2,
                affected_population=850,
                description="Massive rockfall and slope slump blocking NH-21 highway near Hanogi.",
                source="GSI Landslide Inventory"
            )
        ]
        db.add_all(hist_events)

        db.commit()
        print("SUCCESS: Database successfully seeded with Mandi Pilot Region dataset!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
