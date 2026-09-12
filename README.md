# SAMBHAV
 
AI-based interactive quantum algorithm learning and experimentation platform.

This repository is being built as a serious full-stack prototype with:

- Structured learning modules
- Drag-and-drop quantum circuit builder
- Code editor foundation
- Multi-backend quantum simulation abstraction
- Quantum state and measurement visualization
- AI tutoring architecture
- Assessments, progress tracking, and instructor dashboard foundations

## Project Layout

```text
frontend/   React + TypeScript learner interface
backend/    FastAPI backend, simulation orchestration, AI service boundaries
docs/       Architecture, API, and roadmap documentation
```

## Quick Start

### Option 1: One-Click Launch (Frontend + Backend)

Double-click `start-dev.bat` or run:

```bash
# Windows Command Prompt
start-dev.bat

# Windows PowerShell
.\start-dev.ps1
```

### Option 2: Manual Start

**Backend (FastAPI):**

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Frontend (React + Vite):**

```bash
cd frontend
npm install
npm run dev
```

Open the frontend at `http://127.0.0.1:5173` or `http://localhost:5173`.

