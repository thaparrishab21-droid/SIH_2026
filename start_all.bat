@echo off
echo ============================================================
echo Starting AI Disaster Intelligence Command Center Platform
echo ============================================================
echo 1. Starting FastAPI Backend Server on http://127.0.0.1:8080
start "Backend Server" cmd /k "cd backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8080 --reload"

echo 2. Starting React Vite Frontend on http://localhost:5173
start "Frontend App" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are launching in separate windows!
echo Web App URL: http://localhost:5173
echo REST API Docs: http://127.0.0.1:8080/docs
