from typing import Optional
from fastapi import APIRouter, Depends, HTTPException

from app.auth.security import get_optional_current_user
from app.db import repository
from app.quantum.models import SimulationRequest, SimulationResult
from app.quantum.orchestrator import BackendUnavailableError, orchestrator


router = APIRouter()


@router.post("/run", response_model=SimulationResult)
def run_simulation(
    payload: SimulationRequest,
    current_user: Optional[dict] = Depends(get_optional_current_user),
) -> SimulationResult:
    try:
        result = orchestrator.simulate(payload.circuit, payload.options)
        if current_user and current_user.get("sub"):
            try:
                repository.record_simulation_job(
                    user_id=current_user["sub"],
                    backend_name=payload.options.backend or "local_statevector",
                    shots=payload.options.shots or 1024,
                    status="completed",
                    result_dict=result.model_dump(),
                )
            except Exception:
                pass
        return result
    except BackendUnavailableError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

