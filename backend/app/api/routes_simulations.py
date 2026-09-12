from fastapi import APIRouter, HTTPException

from app.quantum.models import SimulationRequest, SimulationResult
from app.quantum.orchestrator import BackendUnavailableError, orchestrator


router = APIRouter()


@router.post("/run", response_model=SimulationResult)
def run_simulation(payload: SimulationRequest) -> SimulationResult:
    try:
        return orchestrator.simulate(payload.circuit, payload.options)
    except BackendUnavailableError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

