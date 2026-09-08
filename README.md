# ⛰️ PREDICT FLOW: Landslide & Flash-Flood Early Warning & Post-Disaster Relief System (v2.0)

**PREDICT FLOW** is an integrated, hyper-local disaster management platform designed for hilly terrain wards (focused on Uttarakhand river valleys like Rudraprayag, Chamoli, and Nainital). It combines **pre-disaster hazard prediction & real-time monitoring** with a dedicated **post-disaster relief & community support coordination portal**.

---

## 🌟 System Architecture & Scope

```
                             ┌──────────────────────────────────────────────┐
                             │       SDMA / DDMA Control Room               │
                             └──────────────────────┬───────────────────────┘
                                                    │
                 ┌──────────────────────────────────┴──────────────────────────────────┐
                 ▼                                                                     ▼
  ┌───────────────────────────────┐                                     ┌───────────────────────────────┐
  │      PRE-DISASTER PHASE       │                                     │     POST-DISASTER RELIEF      │
  │     Prediction & Alerting     │                                     │     Community Support Page    │
  ├───────────────────────────────┤                                     ├───────────────────────────────┤
  │ • AWS Sensor Telemetry Stream │                                     │ • Activates on Critical Alert │
  │ • ML & Physics Risk Engine    │ ────────────── Escalation ─────────►│ • Live Request Feed & Filters │
  │ • Interactive Risk Map        │          (or Official Declared)     │ • Public "Report Need" Form   │
  │ • Safe Zone GIS Routing       │                                     │ • Public "Register Helper"    │
  │ • Multi-lingual WhatsApp/SMS  │                                     │ • Phone Privacy & Anti-Spam   │
  │ • PDF Audit Report Export     │                                     │ • External Donation Links     │
  └───────────────────────────────┘                                     └───────────────────────────────┘
```

The system operates across two clear phases:

1. **Pre-Disaster Phase (Prediction & Alerting Dashboard)**:
   - Evaluates 72h monsoonal precipitation, 1h torrential rainfall rate, soil pore saturation, and slope displacement angle.
   - Computes risk levels (`Safe`, `Watch`, `Warning`, `Critical`) using physics thresholds & XGBoost ML model ($F_1 \approx 0.94$, $ROC\text{-}AUC \approx 0.98$).
   - Automatically dispatches multi-channel emergency alerts (WhatsApp + SMS fallback) in Hindi (`hi`), Garhwali (`gar`), and English (`en`).
   - Calculates nearest evacuation safe zones via Haversine GIS distance logic.
   - Offers single-click PDF Monsoonal Risk Audit Report exports per ward.

2. **Post-Disaster Phase (Relief & Recovery Portal)**:
   - **Activates per-ward** when a `Critical` risk escalation occurs or when a District Official manually declares an active incident.
   - **4 Core Portal Views**:
     1. 🚨 **Live Alerts & Safety**: Real-time risk status, simulation controls, interactive GIS map, and telemetry details.
     2. 🛡️ **Verified Shelters**: Dedicated safe zone registry, evacuation routes, capacity stats, and available supplies.
     3. 🆘 **Community Relief & Charity**: Public disaster help request submission, live relief request feed, helper registration, official verification badges, and third-party SDRF/PMNRF donation links.
     4. 📞 **Emergency Numbers**: One-touch access to disaster helplines (Dial 1077, NDRF, SDRF, Police, Medical, DEOC).
   - **Public Access without Login**: Citizens and volunteers during active events can submit relief requests and register helper services without friction.
   - **Privacy & Safety Controls**: Requester phone numbers are masked publicly (`+91 98765 *****`) to prevent harassment, unmasked only for authenticated officials and verified helpers. Includes anti-spam honeypot inputs and IP rate limiting.
   - **Official Verification**: Officials verify volunteer/NGO helpers (`SDMA VERIFIED`) and update request fulfillment statuses.
   - **Curated Third-Party Fund Links**: Direct links to registered government funds (Uttarakhand SDRF & PMNRF) with an explicit notice that this platform does not collect or hold money directly.

---

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI (Python 3.10+) with async WebSockets (`/ws`).
- **Architecture**: Clean modular architecture (`app/routers/`, `app/services/`, `app/models/`, `app/schemas/`, `app/ml/`).
- **Database & ORM**: SQLite / SQLAlchemy ORM (configured with WAL mode for concurrency, PostgreSQL ready).
- **Machine Learning**: XGBoost classifier trained on historical monsoonal landslide/flood features.
- **Authentication**: Role-Based Access Control (RBAC) with JWT Bearer Tokens and Passlib (`pbkdf2_sha256`) password hashing.
- **Alert Dissemination**: Multi-lingual message engine + Twilio WhatsApp & SMS fallback dispatch.
- **Reporting**: ReportLab PDF document generator.

### Frontend
- **Framework**: React 18 + Vite.
- **Styling**: Vanilla CSS + custom design system (Dark Slate UI palette `#0b1120`).
- **Icons**: Lucide React icon suite.
- **Real-Time Data**: WebSocket streaming client (`api.js`).

---

## 📁 Repository Directory Structure

```
SIH_2026/
├── backend/
│   ├── app/
│   │   ├── ml/                 # Machine learning models & saved weight artifacts
│   │   ├── models/             # SQLAlchemy ORM database models
│   │   ├── routers/            # FastAPI modular routers (auth, wards, alerts, shelters, relief, telemetry)
│   │   ├── schemas/            # Pydantic v2 request & response schemas
│   │   ├── services/           # Business logic services (auth, ML, risk engine, PDF, safe zone GIS, WhatsApp)
│   │   ├── config.py           # Application settings & environment configuration
│   │   ├── database.py         # SQLAlchemy engine & session setup
│   │   ├── main.py             # FastAPI core application instance & WebSocket endpoints
│   │   └── __init__.py
│   ├── .env.example            # Environment variables template
│   ├── flood_flash.db          # SQLite database storage
│   ├── main.py                 # Backend entry point forwarder
│   ├── MODEL_CARD.md           # Machine Learning model card & metrics
│   ├── README.md               # Backend documentation
│   ├── requirements.txt        # Python backend dependencies
│   ├── seed_data.py            # Database seeder (18 wards, safe zones, initial readings, accounts)
│   └── test_api.py             # Automated API, RBAC, and relief endpoint test suite
│
└── frontend/
    ├── index.html              # HTML entry point
    ├── package.json            # Node.js dependencies
    ├── vite.config.js          # Vite build configuration
    └── src/
        ├── api.js              # Centralized API client & WebSocket listener
        ├── App.jsx             # Main layout, tab navigation & global modal state
        ├── index.css           # Global design system & theme variables
        └── components/
            ├── Header.jsx                      # App navigation bar with tab selectors & identity modal button
            ├── LiveAlertsSafetyView.jsx        # Pre-disaster risk overview, alerts banner, map toggle & telemetry
            ├── VerifiedSheltersView.jsx        # Dedicated safe shelters tab with capacity stats & map view
            ├── ReliefCharityView.jsx           # Post-disaster relief portal with request feed & donation links
            ├── EmergencyNumbersView.jsx        # Emergency helplines tab (Dial 1077, NDRF, SDRF, DEOC)
            ├── IdentityAuthModal.jsx           # Citizen portal login (Official) and registration modal
            ├── RequestDisasterHelpModal.jsx     # Relief request submission modal (food, medical, rescue, etc.)
            ├── MapView.jsx                     # Interactive Leaflet / GIS risk map with safe zone markers
            ├── TriggerAlertModal.jsx           # Official emergency alert broadcast modal
            ├── KeyboardShortcutsModal.jsx     # Control room shortcut keys modal
            └── DisseminationLog.jsx            # Emergency alert dispatch log component
```

---

## 🔐 Default Demo & Control Room Accounts

The system implements Role-Based Access Control (RBAC):

| Username | Password | Role | Permissions |
| :--- | :--- | :--- | :--- |
| `admin_official` | `official123` | `district_official` | Full Access: Activate/deactivate incidents, verify helpers, update request statuses, broadcast emergency alerts, run simulation spikes |
| `observer` | `viewer123` | `viewer` | Read-Only: Inspect risk map telemetry, view public relief feeds, download PDF reports |

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install backend dependencies
pip install -r requirements.txt

# Seed database with initial wards, active incidents, relief requests, and safe zones
python seed_data.py

# Start FastAPI server
python -m uvicorn app.main:app --reload --port 8000
```
*Alternatively, from the project root directory:*
```bash
python -m backend.seed_data
python -m uvicorn backend.main:app --reload --port 8000
```

Backend API interactive documentation will be live at: **http://localhost:8000/docs**

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Frontend application will be live at: **http://localhost:5173**

---

## 📡 API Endpoints Reference

### 🔐 Authentication
- `POST /auth/login`: Authenticate official/user and receive JWT token.
- `GET /auth/me`: Retrieve current user profile.

### ⛰️ Wards & Telemetry (Pre-Disaster)
- `GET /wards`: List all wards with current risk scores, levels, and nearest safe zone.
- `GET /wards/{id}`: Detailed telemetry for a specific ward.
- `GET /wards/{id}/readings`: Time-series sensor readings (rainfall 1h/24h/72h, soil moisture, slope angle).
- `GET /wards/{id}/incidents`: Historical disaster incident log.
- `GET /wards/{id}/report`: Export and download PDF monsoonal hazard audit report.
- `POST /wards/{id}/simulate-reading`: Inject custom sensor reading (Official only).

### 🚨 Emergency Alerts & Safe Zones
- `GET /safe-zones`: List evacuation safe zones with capacities and coordinates.
- `GET /alerts`: Log of dispatched multi-lingual alerts.
- `POST /alerts/trigger`: Manually dispatch emergency alert (Official only).
- `WS /ws`: Real-time WebSocket connection for live telemetry updates.

### 🆘 Post-Disaster Relief & Recovery
- `POST /wards/{id}/activate-incident`: Activate active disaster mode for a ward (Official only).
- `POST /wards/{id}/deactivate-incident`: Mark recovery complete and deactivate incident (Official only).
- `GET /wards/{id}/relief-status`: Get active incident banner info, relief requests, and relief helpers (requester phone numbers are masked for public users).
- `POST /relief-requests`: Public submission of urgent community needs (No login required; anti-spam honeypot + IP rate limiting).
- `PATCH /relief-requests/{id}`: Update request status (`open`, `in_progress`, `fulfilled`) or hide entry (Official / verified helper).
- `POST /relief-providers`: Public helper/volunteer registration (starts unverified).
- `PATCH /relief-providers/{id}/verify`: Verify a registered helper (Official only).
- `GET /donation-links`: Curated external donation link directory for third-party funds.

### 🏥 System & Diagnostics
- `GET /health`: Basic operational status.
- `GET /system-health`: Detailed data mesh & system health metrics.
- `GET /risk-thresholds`: Risk level threshold score configurations.

---

## 🧪 Testing & Verification

Run the automated backend test suite to test authentication, RBAC, simulation spikes, PDF generation, and all relief endpoints:

```bash
python -m backend.test_api
```

To test frontend production compilation:
```bash
cd frontend
npm run build
```

---

## 🛡️ Non-Financial Handling Compliance Notice

> **Important**: This platform does **NOT** process, collect, or hold monetary payments directly. All donation links provided in the Post-Disaster Relief section direct to verified third-party government funds (**Uttarakhand SDRF**, **PMNRF**) or accredited charities, accompanied by prominent disclaimer notices across the UI and API documentation.
