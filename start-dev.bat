@echo off
cd /d "%~dp0"
echo ===================================================
echo Starting SAMBHAV Quantum Platform
echo ===================================================

echo [1/2] Launching Backend on http://127.0.0.1:8000...
start "SAMBHAV Backend (FastAPI)" cmd /k "cd /d ""%~dp0backend"" && python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

echo [2/2] Launching Frontend on http://127.0.0.1:5173...
start "SAMBHAV Frontend (Vite)" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"

echo.
echo Launching browser in 2 seconds...
timeout /t 2 /nobreak >nul
start http://127.0.0.1:5173

echo ===================================================
echo SAMBHAV is Running!
echo Frontend: http://127.0.0.1:5173
echo Backend:  http://127.0.0.1:8000
echo ===================================================
