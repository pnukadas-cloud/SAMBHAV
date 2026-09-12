from fastapi import APIRouter
from pydantic import BaseModel

from app.quantum.models import CircuitIR


router = APIRouter()


class CircuitExplanationRequest(BaseModel):
    circuit: CircuitIR
    learnerLevel: str = "beginner"


class CodeRequest(BaseModel):
    code: str
    framework: str = "qiskit"


@router.post("/explain-circuit")
def explain_circuit(payload: CircuitExplanationRequest) -> dict[str, str | list[str]]:
    gates = [operation.gate.upper() for operation in payload.circuit.operations]
    has_bell_pattern = payload.circuit.qubits >= 2 and gates[:2] == ["H", "CX"]
    if has_bell_pattern:
        explanation = (
            "This circuit creates a Bell state. The H gate places qubit 0 into superposition, "
            "and the CX gate copies the measurement relationship onto qubit 1, producing correlated outcomes."
        )
        suggestions = ["Run it several times and compare the 00 and 11 counts.", "Remove CX to see superposition without entanglement."]
    else:
        explanation = (
            "The circuit applies gates in sequence to transform the quantum state before measurement. "
            "Use the probability chart to connect each gate choice to observable outcomes."
        )
        suggestions = ["Try a single-qubit H gate first.", "Add measurement after each qubit when comparing results."]
    return {"mode": "rule_based_prototype", "explanation": explanation, "suggestions": suggestions}


@router.post("/debug-code")
def debug_code(payload: CodeRequest) -> dict[str, list[str]]:
    issues: list[str] = []
    if "QuantumCircuit" not in payload.code:
        issues.append("No QuantumCircuit construction found.")
    if "measure" not in payload.code:
        issues.append("No measurement found; add measurement to produce shot counts.")
    if not issues:
        issues.append("No obvious structural issues found in the prototype debugger.")
    return {"issues": issues}


@router.post("/optimize-circuit")
def optimize_circuit(payload: CircuitExplanationRequest) -> dict[str, list[str]]:
    suggestions: list[str] = []
    previous_gate = None
    for operation in payload.circuit.operations:
        if operation.gate == previous_gate and operation.gate in {"x", "h", "z"}:
            suggestions.append(f"Two adjacent {operation.gate.upper()} gates may cancel or simplify depending on placement.")
        previous_gate = operation.gate
    if not suggestions:
        suggestions.append("No simple gate cancellation was detected. Keep the circuit readable for learning.")
    return {"suggestions": suggestions}

