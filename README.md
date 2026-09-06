# ⛰️ Flood-Flash: Landslide & Flash-Flood Early Warning & Post-Disaster Relief System (v2.0)

**Flood-Flash** is an integrated, hyper-local disaster management platform designed for hilly terrain wards (focused on Uttarakhand river valleys like Rudraprayag, Chamoli, and Nainital). It combines **pre-disaster hazard prediction & real-time monitoring** with a dedicated **post-disaster relief & community support coordination page**.

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
  │ • Interactive Risk Map        │          (or Official Declared)      │ • Public "Report Need" Form   │
  │ • Safe Zone GIS Routing       │                                     │ • Public "Register Helper"    │
  │ • Multi-lingual WhatsApp/SMS  │                                     │ • Phone Privacy & Anti-Spam   │
  │ • PDF Audit Report Export     │                                     │ • External Donation Links     │
  └───────────────────────────────┘                                     └───────────────────────────────┘
```

The system operates across two clear phases:

1. **Pre-Disaster Phase (Prediction & Alerting Dashboard)**:
   - Evaluates 72h monsoonal precipitation, 1h torrential rainfall rate, soil pore saturation, and slope displacement angle.
   - Computes risk levels (`Safe`, `Watch`, `Warning`, `Critical`) using physics thresholds & XGBoost ML model.
   - Automatically dispatches multi-channel alerts (WhatsApp + SMS fallback) in Hindi (`hi`), Garhwali (`gar`), and English (`en`).
   - Calculates nearest evacuation safe zones via Haversine GIS distance logic.

2. **Post-Disaster Phase (Relief & Recovery Portal)**:
   - **Activates per-ward** when a `Critical` risk escalation occurs or when a District Official manually declares an active incident.
   - **Live Feed of Needs**: Displays real-time relief requests (`food`, `water`, `medical`, `shelter`, `clothing`, `rescue`), filterable by urgency and type.
   - **Public Access without Login**: Villagers and volunteers during active events can report needs and register helper services without needing an account.
   - **Privacy & Safety Controls**: Requester phone numbers are masked publicly (`+91 98765 *****`) to prevent harassment, unmasked only for authenticated officials and verified helpers. Includes anti-spam honeypot inputs and IP rate limiting.
   - **Official Verification**: Officials verify volunteer/NGO helpers (`SDMA VERIFIED`) and update request fulfillment statuses.
   - **Curated Third-Party Fund Links**: Direct links to registered government funds (Uttarakhand SDRF & PMNRF) with an explicit notice that this platform does not collect or hold money directly.

---

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI (Python 3.10+) with async WebSockets (`/ws`).
- **Database & ORM**: SQLite / SQLAlchemy ORM (compatible with PostgreSQL).
- **Machine Learning**: XGBoost ($F_1 \approx 0.94$, $ROC\text{-}AUC \approx 0.98$).
- **Authentication**: JWT Bearer Tokens with Passlib (`pbkdf2_sha256`) password hashing.
- **Alert Dissemination**: Multi-lingual message engine + Twilio WhatsApp & SMS fallback.
- **Reporting**: ReportLab PDF document generator.

### Frontend
- **Framework**: React 18 + Vite.
- **Styling**: Vanilla CSS + Tailwind CSS tokens (Dark Slate UI palette `#0b1120`).
- **Icons**: Lucide React icons.
- **Real-Time Data**: WebSocket streaming client (`api.js`).

---

## 📁 Repository Directory Structure

```
SIH_2026/
├── backend/
│   ├── auth.py                 # JWT token creation, verification & RBAC dependencies
│   ├── config.py               # Application settings & environment configuration
│   ├── database.py             # SQLAlchemy database session & engine setup
│   ├── main.py                 # FastAPI application routes, WebSockets & auto-alerts
│   ├── ml_risk_engine.py       # XGBoost ML model loader & fallback physics engine
│   ├── models.py               # Database schemas (Ward, SensorReading, Alert, ReliefRequest, etc.)
│   ├── pdf_service.py          # PDF monsoonal audit report generator
│   ├── requirements.txt        # Python backend dependencies
│   ├── risk_engine.py          # Integrated physics & ML risk calculation logic
│   ├── safe_zone_service.py    # Safe zone GIS Haversine routing engine
│   ├── schemas.py              # Pydantic v2 request/response schemas
│   ├── seed_data.py            # Database seeder (18 wards, active incidents, relief requests)
│   ├── test_api.py             # Automated API & RBAC test suite
│   └── whatsapp_service.py     # Multi-lingual WhatsApp & SMS fallback engine
│
└── frontend/
    ├── index.html              # HTML entry point
    ├── package.json            # Node.js dependencies
    ├── vite.config.js          # Vite build configuration
    └── src/
        ├── api.js              # Central API client & WebSocket listener
        ├── App.jsx             # Main application layout, routing & tab state
        ├── index.css           # Global design system styles
        └── components/
            ├── ReliefRecoveryView.jsx  # NEW: Post-disaster relief portal view
            ├── Header.jsx              # App header with main navigation tabs
            ├── MapView.jsx             # Interactive GIS risk map
            ├── SummaryStrip.jsx        # Telemetry summary statistics strip
            ├── WardDetailPanel.jsx     # Slide-in ward telemetry detail panel
            ├── DisseminationLog.jsx    # Emergency alert dispatch log
            ├── SystemHealth.jsx        # Data mesh & system health monitor
            ├── TriggerAlertModal.jsx   # Official emergency alert modal
            ├── LoginModal.jsx          # Control room login modal
            └── KeyboardShortcutsModal.jsx # Control room shortcut keys modal
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
# Navigate to project root
cd SIH_2026

# Install backend dependencies
pip install -r backend/requirements.txt

# Seed database with initial wards, active incidents, relief requests, and safe zones
python -m backend.seed_data

# Start FastAPI server
uvicorn backend.main:app --reload --port 8000
```
Backend API interactive documentation will be live at: **http://localhost:8000/docs**

### 3. Frontend Setup
Open a new terminal window:
```bash
cd SIH_2026/frontend

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

### 🆘 Post-Disaster Relief & Recovery (NEW)
- `POST /wards/{id}/activate-incident`: Activate active disaster mode for a ward (Official only).
- `POST /wards/{id}/deactivate-incident`: Mark recovery complete and deactivate incident (Official only).
- `GET /wards/{id}/relief-status`: Get active incident banner info, relief requests, and relief helpers (requester phone numbers are masked for public users).
- `POST /relief-requests`: Public submission of urgent community needs (No login required; anti-spam honeypot + IP rate limiting).
- `PATCH /relief-requests/{id}`: Update request status (`open`, `in_progress`, `fulfilled`) or hide entry (Official / verified helper).
- `POST /relief-providers`: Public helper/volunteer registration (starts unverified).
- `PATCH /relief-providers/{id}/verify`: Verify a registered helper (Official only).
- `GET /donation-links`: Curated external donation link directory for third-party funds.

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
