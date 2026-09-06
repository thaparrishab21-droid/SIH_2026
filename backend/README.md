# 🌊 Flood-Flash Backend API (v2.0 Operational)

A hyper-local landslide & flash-flood early warning system backend powering real-time risk monitoring across hilly terrain wards (Uttarakhand).

---

## 🚀 Technology Stack & Features
- **FastAPI**: Modern, high-performance web framework with async WebSocket support.
- **SQLite / SQLAlchemy ORM**: Lightweight local storage structured for simple migration to PostgreSQL.
- **Pydantic v2**: Strict request & response validation and schemas.
- **XGBoost ML Risk Engine**: Real-time Machine Learning hazard classifier ($F_1 \approx 0.94$, $ROC\text{-}AUC \approx 0.98$).
- **JWT Role-Based Access Control (RBAC)**: Password hashing with SHA-256 + HMAC salt, token management, and role authorization (`district_official` vs `viewer`).
- **Multi-Language Alert Dissemination**: Contextual emergency advisory messages generated in **Hindi (`hi`)**, **English (`en`)**, and **Garhwali (`gar`)**.
- **SMS Fallback Dispatch**: Automated multi-channel failover to Twilio SMS if WhatsApp fails or subscriber is non-WhatsApp registered.
- **GIS Safe Zone Evacuation Engine**: Haversine distance and cardinal direction calculation identifying nearest emergency safe zones.
- **PDF Incident Report Generator**: ReportLab integration generating official monsoonal risk audit documents.
- **Real-Time WebSockets (`WS /ws`)**: Low-latency event streaming pushing live risk elevations and alert triggers to control room dashboards.

---

## 🛠️ Setup & Installation

### 1. Install Dependencies
```bash
pip install -r backend/requirements.txt
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp backend/.env.example .env
```

### 3. Seed Database
Run the seed script to populate 18 realistic wards in Uttarakhand (Rudraprayag, Chamoli, Nainital), RBAC accounts, safe zones, historical incidents, initial sensor readings, and multi-lingual subscribers:
```bash
python -m backend.seed_data
```

### 4. Start Server
Launch the FastAPI server with Uvicorn:
```bash
uvicorn backend.main:app --reload --port 8000
```
Interactive API documentation will be available at: **http://localhost:8000/docs**

---

## 🔐 Authentication & Control Room Demo Accounts

The API enforces Role-Based Access Control (RBAC) via JWT Bearer Tokens:

| Username | Password | Role | Permissions |
| :--- | :--- | :--- | :--- |
| `admin_official` | `official123` | `district_official` | Full Read & Write (Can trigger emergency alerts & execute simulation spikes) |
| `observer` | `viewer123` | `viewer` | Read-Only (Can inspect map telemetry & incident reports) |

---

## 📱 Multi-Channel Alerting (WhatsApp + SMS Fallback)

1. **Multi-Language Support**:
   - **Hindi (`hi`)**: "🚨 भूस्खलन एवं फ्लैश-फ्लड चेतावनी..."
   - **Garhwali (`gar`)**: "🚨 भूस्खलन र बाड़ै चेतावनी..."
   - **English (`en`)**: "🚨 LANDSLIDE & FLASH-FLOOD EMERGENCY WARNING..."

2. **SMS Fallback Engine**:
   When an alert is broadcast, the service checks subscriber channel preference and delivery status. If a WhatsApp attempt fails or if subscriber has `preferred_channel = 'sms'`, the system automatically dispatches an SMS via Twilio.

---

## 📡 API Endpoints Summary

| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Public | Authenticate user & acquire JWT Bearer Token |
| `GET` | `/auth/me` | Bearer Token | Fetch authenticated user profile |
| `GET` | `/wards` | Public | List all wards with ML risk level & nearest safe zone |
| `GET` | `/wards/{id}` | Public | Detailed ward telemetry, sensors, risk factors & nearest safe zone |
| `GET` | `/wards/{id}/readings?hours=72` | Public | Time-series sensor readings for charts |
| `GET` | `/wards/{id}/incidents` | Public | Historical incident log for ward |
| `GET` | `/wards/{id}/report` | Public | Generate & download official PDF Incident Report |
| `POST` | `/wards/{id}/simulate-reading` | `district_official` | Inject custom sensor reading, recalculate ML risk & broadcast |
| `GET` | `/safe-zones` | Public | List all registered emergency evacuation safe zones |
| `GET` | `/alerts` | Public | Query alert history log with multi-channel details |
| `POST` | `/alerts/trigger` | `district_official` | Manually dispatch multi-lingual WhatsApp & SMS alerts |
| `WS` | `/ws` | Public | Real-time WebSocket connection for live telemetry & alert streaming |
| `GET` | `/health` | Public | System health & ML risk engine status |

