@echo off
echo ===================================================
echo Starting SAMBHAV Quantum Platform (Dev Server)
echo ===================================================

echo [1/2] Launching Backend on http://127.0.0.1:8000...
start "SAMBHAV Backend (FastAPI)" cmd /k "cd backend && python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

echo [2/2] Launching Frontend on http://127.0.0.1:5173...
start "SAMBHAV Frontend (Vite)" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo Services Started!
echo Frontend: http://127.0.0.1:5173
echo Backend:  http://127.0.0.1:8000
echo ===================================================
