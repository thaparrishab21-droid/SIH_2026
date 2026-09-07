# 🌊 Flood-Flash Backend API (v2.0 Modular Architecture)

A hyper-local landslide & flash-flood early warning system backend powering real-time risk monitoring across hilly terrain wards (Uttarakhand).

---

## 🚀 Technology Stack & Features
- **FastAPI**: Modern, high-performance web framework with async WebSocket support.
- **Clean Modular Architecture**: Clean separation of concerns into `app/routers/`, `app/services/`, `app/models/`, `app/schemas/`, and `app/ml/`.
- **SQLite / SQLAlchemy ORM**: Lightweight local storage structured for simple migration to PostgreSQL (configured with WAL mode).
- **Pydantic v2**: Strict request & response validation and schemas.
- **XGBoost ML Risk Engine**: Real-time Machine Learning hazard classifier ($F_1 \approx 0.94$, $ROC\text{-}AUC \approx 0.98$).
- **JWT Role-Based Access Control (RBAC)**: Password hashing with SHA-256 / PBKDF2, token management, and role authorization (`district_official` vs `viewer`).
- **Multi-Language Alert Dissemination**: Contextual emergency advisory messages generated in **Hindi (`hi`)**, **English (`en`)**, and **Garhwali (`gar`)**.
- **SMS Fallback Dispatch**: Automated multi-channel failover to Twilio SMS if WhatsApp fails or subscriber is non-WhatsApp registered.
- **GIS Safe Zone Evacuation Engine**: Haversine distance and cardinal direction calculation identifying nearest emergency safe zones.
- **PDF Incident Report Generator**: ReportLab integration generating official monsoonal risk audit documents.
- **Post-Disaster Community Relief Engine**: Incident activation, public disaster help submission, anti-spam honeypot + IP rate-limiting, phone number privacy masking (`+91 98765 *****`), and helper verification workflow.
- **Real-Time WebSockets (`WS /ws`)**: Low-latency event streaming pushing live risk elevations and alert triggers to control room dashboards.

---

## 🛠️ Setup & Installation

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Seed Database
Run the seed script to populate 18 realistic wards in Uttarakhand (Rudraprayag, Chamoli, Nainital), RBAC accounts, safe zones, historical incidents, initial sensor readings, and relief requests:
```bash
python seed_data.py
```
*(Or from root directory: `python -m backend.seed_data`)*

### 4. Start Server
Launch the FastAPI server with Uvicorn:
```bash
python -m uvicorn app.main:app --reload --port 8000
```
*(Or from root directory: `python -m uvicorn backend.main:app --reload --port 8000`)*

Interactive API documentation will be available at: **http://localhost:8000/docs**

---

## 🔐 Authentication & Control Room Demo Accounts

The API enforces Role-Based Access Control (RBAC) via JWT Bearer Tokens:

| Username | Password | Role | Permissions |
| :--- | :--- | :--- | :--- |
| `admin_official` | `official123` | `district_official` | Full Read & Write (Can trigger emergency alerts, verify helpers, update request statuses & execute simulation spikes) |
| `observer` | `viewer123` | `viewer` | Read-Only (Can inspect map telemetry, view public relief feeds & download PDF reports) |

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
| `POST` | `/wards/{id}/activate-incident` | `district_official` | Activate disaster mode for ward |
| `POST` | `/wards/{id}/deactivate-incident` | `district_official` | Deactivate incident mode for ward |
| `GET` | `/wards/{id}/relief-status` | Public / Optional Token | Get active banner info, requests & helpers (masked phone numbers for public) |
| `POST` | `/relief-requests` | Public | Public submission of urgent relief request (anti-spam + IP rate limit) |
| `PATCH` | `/relief-requests/{id}` | Official / Helper | Update request fulfillment status (`open`, `in_progress`, `fulfilled`) |
| `POST` | `/relief-providers` | Public | Public volunteer/helper registration |
| `PATCH` | `/relief-providers/{id}/verify` | `district_official` | Verify registered helper with SDMA verification badge |
| `GET` | `/donation-links` | Public | Curated third-party SDRF/PMNRF government fund links |
| `GET` | `/safe-zones` | Public | List all registered emergency evacuation safe zones |
| `GET` | `/alerts` | Public | Query alert history log with multi-channel details |
| `POST` | `/alerts/trigger` | `district_official` | Manually dispatch multi-lingual WhatsApp & SMS alerts |
| `WS` | `/ws` | Public | Real-time WebSocket connection for live telemetry & alert streaming |
| `GET` | `/health` | Public | System health & operational status |
| `GET` | `/system-health` | Public | Comprehensive data mesh diagnostics |
| `GET` | `/risk-thresholds` | Public | Risk level threshold configurations |

---

## 🧪 Testing & Verification

Run the automated backend test suite:
```bash
python test_api.py
```
*(Or from root directory: `python -m backend.test_api`)*
