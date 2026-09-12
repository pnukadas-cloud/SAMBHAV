from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth.security import get_current_user, get_optional_current_user
from app.db import repository
from app.quantum.models import CircuitIR, ValidationResult
from app.quantum.orchestrator import orchestrator


router = APIRouter()


class CircuitCodeRequest(BaseModel):
    circuit: CircuitIR
    framework: str = "qiskit"


class SaveCircuitRequest(BaseModel):
    title: str
    circuit: CircuitIR
    description: Optional[str] = None
    framework: str = "qiskit"


@router.get("/backends")
def list_backends() -> dict[str, list[str]]:
    return {
        "available": orchestrator.available_backends(),
        "planned": ["pennylane", "cirq", "qbraid"],
    }


@router.post("/validate", response_model=ValidationResult)
def validate_circuit(circuit: CircuitIR) -> ValidationResult:
    return orchestrator.validate(circuit)


@router.post("/to-code")
def circuit_to_code(payload: CircuitCodeRequest) -> dict[str, str]:
    if payload.framework != "qiskit":
        return {"framework": payload.framework, "code": "# This framework adapter is planned but not implemented yet."}

    lines = [
        "from qiskit import QuantumCircuit",
        "",
        f"qc = QuantumCircuit({payload.circuit.qubits}, {max(payload.circuit.classicalBits, payload.circuit.qubits)})",
    ]
    for operation in payload.circuit.operations:
        gate = operation.gate
        if gate in {"h", "x", "y", "z", "s", "t"}:
            lines.append(f"qc.{gate}({operation.targets[0]})")
        elif gate in {"rx", "ry", "rz"}:
            lines.append(f"qc.{gate}({operation.params[0]}, {operation.targets[0]})")
        elif gate in {"cx", "cz"}:
            lines.append(f"qc.{gate}({operation.controls[0]}, {operation.targets[0]})")
        elif gate == "swap":
            lines.append(f"qc.swap({operation.targets[0]}, {operation.targets[1]})")
        elif gate == "measure":
            for index, target in enumerate(operation.targets):
                classical = operation.classicalTargets[index] if index < len(operation.classicalTargets) else target
                lines.append(f"qc.measure({target}, {classical})")
    lines.append("")
    lines.append("print(qc)")
    return {"framework": "qiskit", "code": "\n".join(lines)}


@router.post("/save")
def save_user_circuit(
    payload: SaveCircuitRequest,
    current_user: dict = Depends(get_current_user),
) -> dict[str, Any]:
    saved = repository.save_circuit(
        owner_id=current_user["sub"],
        title=payload.title,
        circuit_ir=payload.circuit.model_dump(),
        description=payload.description,
        framework=payload.framework,
    )
    return {"status": "saved", "circuit": saved}


@router.get("/my-circuits")
def list_my_circuits(current_user: dict = Depends(get_current_user)) -> list[dict[str, Any]]:
    return repository.get_user_circuits(current_user["sub"])


@router.delete("/{circuit_id}")
def delete_user_circuit(circuit_id: str, current_user: dict = Depends(get_current_user)) -> dict[str, str]:
    deleted = repository.delete_circuit(circuit_id, current_user["sub"])
    if not deleted:
        raise HTTPException(status_code=404, detail="Circuit not found or unauthorized")
    return {"status": "deleted"}
