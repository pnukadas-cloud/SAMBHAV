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

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Open the frontend at `http://localhost:5173`.
