Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "Starting SAMBHAV Quantum Platform (Dev Server)" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

Write-Host "[1/2] Launching Backend on http://127.0.0.1:8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

Write-Host "[2/2] Launching Frontend on http://127.0.0.1:5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host ""
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "Services Started!" -ForegroundColor Cyan
Write-Host "Frontend: http://127.0.0.1:5173" -ForegroundColor Green
Write-Host "Backend:  http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host "===================================================" -ForegroundColor Cyan
