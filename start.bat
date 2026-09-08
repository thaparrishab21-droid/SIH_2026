@echo off
echo ========================================================
echo   Starting Flood-Flash Predictive Early Warning System
echo ========================================================
echo.

echo 1. Seeding Database...
python -m backend.seed_data

echo 2. Launching FastAPI Backend on http://localhost:8000 ...
start "Flood-Flash Backend API" cmd /k "python -m uvicorn backend.main:app --port 8000 --reload"

echo 3. Launching Vite Frontend Dashboard on http://localhost:5173 ...
cd frontend
start "Flood-Flash Frontend UI" cmd /k "npm run dev"

echo.
echo ========================================================
echo   Both services started!
echo   - Backend API Docs: http://localhost:8000/docs
echo   - Frontend Dashboard: http://localhost:5173
echo ========================================================
