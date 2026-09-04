@echo off
echo Stopping active backend and frontend servers...
taskkill /FI "WINDOWTITLE eq Backend Server*" /F 2>nul
taskkill /FI "WINDOWTITLE eq Frontend App*" /F 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000.*LISTENING"') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173.*LISTENING"') do taskkill /F /PID %%a 2>nul
echo All servers stopped!
