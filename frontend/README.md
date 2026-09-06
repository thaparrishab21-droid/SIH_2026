# 🌊 Flood-Flash Frontend Dashboard

A disaster management dashboard for officials monitoring landslide and flash-flood risk across hilly wards in real time.

---

## ⚡ Quickstart

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Ensure `VITE_API_BASE_URL` points to your backend:
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   ```

3. **Run Frontend Dev Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🛠️ CORS Troubleshooting Note

If your browser console displays `CORS error` when calling `http://localhost:8000`:
1. Ensure the FastAPI backend is running on `http://localhost:8000`.
2. The FastAPI `main.py` includes CORS middleware permitting `http://localhost:5173`, `http://127.0.0.1:5173`, and `*`.
3. If running frontend on a custom host or port (e.g. `http://localhost:3000`), update `CORS_ORIGINS` in `backend/config.py` or `.env`.

---

## ⚡ Live Demo Feature

Use the **"⚡ Demo Spike Test"** button in the map control bar or Ward Detail panel to inject a live torrential rainfall simulation into the FastAPI risk engine (`POST /wards/{id}/simulate-reading`). This will immediately re-score risk to `CRITICAL` on the map and dispatch a real WhatsApp notification via Twilio!
