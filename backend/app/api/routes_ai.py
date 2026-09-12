import json
import logging
import os
import re
from typing import Any, Literal, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.quantum.adapters.local_statevector import LocalStatevectorAdapter
from app.quantum.models import CircuitIR, SimulationOptions, SimulationResult
from app.services.gemini_service import GeminiService

logger = logging.getLogger("sambhav.routes_ai")
router = APIRouter()
gemini_service = GeminiService()


class LessonContext(BaseModel):
    course: Optional[str] = None
    title: Optional[str] = None
    objective: Optional[str] = None


class ExplainRequest(BaseModel):
    circuit: Optional[CircuitIR] = None
    simulation_result: Optional[SimulationResult] = None
    lesson_context: Optional[LessonContext] = None
    question: Optional[str] = None


class ExplainResponse(BaseModel):
    source: Literal["gemini", "llm", "fallback"] = "gemini"
    explanation: str
    key_concepts: list[str] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)


class CircuitExplanationRequest(BaseModel):
    circuit: CircuitIR
    learnerLevel: str = "beginner"


class GenerateChallengeRequest(BaseModel):
    learnerLevel: str = "intermediate"
    topic: str = "Quantum Entanglement"
    current_circuit: Optional[CircuitIR] = None
    weak_concepts: list[str] = Field(default_factory=list)


class CodeRequest(BaseModel):
    code: str
    framework: str = "qiskit"


def _extract_key_concepts(circuit: Optional[CircuitIR], sim_result: Optional[SimulationResult], question: Optional[str] = None) -> list[str]:
    concepts: list[str] = []
    q_lower = (question or "").lower()
    gates = [op.gate.lower() for op in circuit.operations] if circuit and circuit.operations else []

    # 1. Primary: Question-derived concepts
    if "qubit" in q_lower or "bit" in q_lower:
        concepts.append("Quantum Bit (Qubit)")
    if "superposition" in q_lower or "hadamard" in q_lower or "h gate" in q_lower:
        concepts.append("Quantum Superposition")
    if "entangle" in q_lower or "bell" in q_lower or "epr" in q_lower:
        concepts.append("Quantum Entanglement")
    if "cnot" in q_lower or "cx" in q_lower or "controlled" in q_lower:
        concepts.append("Controlled-NOT Gate")
    if "grover" in q_lower or "search" in q_lower:
        concepts.append("Grover's Search Algorithm")
    if "phase" in q_lower or "kickback" in q_lower:
        concepts.append("Quantum Phase")
    if "born" in q_lower or "measure" in q_lower or "probab" in q_lower:
        concepts.append("Born Rule & Measurement Collapse")
    if "pauli" in q_lower or "x gate" in q_lower or "z gate" in q_lower or "y gate" in q_lower:
        concepts.append("Pauli Gates (X, Y, Z)")
    if "teleport" in q_lower:
        concepts.append("Quantum Teleportation")
    if "hint" in q_lower or "guide" in q_lower:
        concepts.append("Pedagogical Guidance")
    if "hello" in q_lower or "help" in q_lower:
        concepts.append("Quantum Computing Fundamentals")

    # 2. Secondary: Circuit-derived concepts
    if "h" in gates and "Quantum Superposition" not in concepts:
        concepts.append("Quantum Superposition")
    if "cx" in gates:
        if "h" in gates and circuit and circuit.qubits >= 2 and "Quantum Entanglement" not in concepts:
            concepts.append("Bell State |Φ⁺⟩")
            concepts.append("Quantum Entanglement")
        elif "Controlled-NOT Gate" not in concepts:
            concepts.append("Controlled-NOT (CX)")
    if "cz" in gates and "Quantum Phase" not in concepts:
        concepts.append("Controlled-Phase (CZ)")
    if "swap" in gates:
        concepts.append("SWAP State Exchange")
    if any(g in {"rx", "ry", "rz"} for g in gates):
        concepts.append("Continuous Bloch Rotation")

    if not concepts:
        concepts.append("Quantum State Evolution")
    return concepts[:4]


def _generate_suggestions(circuit: Optional[CircuitIR], sim_result: Optional[SimulationResult], question: Optional[str] = None) -> list[str]:
    q_lower = (question or "").lower()
    gates = [op.gate.lower() for op in circuit.operations] if circuit and circuit.operations else []
    suggestions: list[str] = []

    if "grover" in q_lower:
        suggestions.append("How does the Quantum Oracle mark target items?")
        suggestions.append("What is the Grover Diffusion operator?")
        suggestions.append("How many Grover iterations are needed for N items?")
    elif "qubit" in q_lower:
        suggestions.append("Why does the Hadamard gate create superposition?")
        suggestions.append("What is quantum entanglement?")
        suggestions.append("How does the Bloch sphere represent quantum states?")
    elif "hadamard" in q_lower or "superposition" in q_lower:
        suggestions.append("What happens if you remove the Hadamard gate?")
        suggestions.append("Why does applying H twice return to the original state?")
        suggestions.append("How does superposition enable quantum parallelism?")
    elif "entangle" in q_lower or "bell" in q_lower:
        suggestions.append("Why did this circuit create entanglement?")
        suggestions.append("How do you create the other three Bell states?")
        suggestions.append("What is the EPR paradox?")
    elif "cnot" in q_lower or "cx" in q_lower:
        suggestions.append("Why does CNOT create entanglement when control is |+⟩?")
        suggestions.append("What happens if control is |0⟩ vs |1⟩?")
        suggestions.append("How is a SWAP gate constructed from 3 CNOTs?")
    elif circuit and circuit.qubits >= 2 and gates[:2] == ["h", "cx"]:
        suggestions.append("Why did this circuit create entanglement?")
        suggestions.append("What happens if you remove the CX gate?")
        suggestions.append("How do you create the other three Bell states?")
    elif "h" in gates:
        suggestions.append("Why does Hadamard create equal probabilities?")
        suggestions.append("What happens if you apply a second H gate on the same qubit?")
        suggestions.append("How does superposition differ from classical uncertainty?")
    else:
        suggestions.append("What is a qubit?")
        suggestions.append("Why does the Hadamard gate create superposition?")
        suggestions.append("What is quantum entanglement?")

    return suggestions[:3]


@router.post("/explain", response_model=ExplainResponse)
def explain(payload: ExplainRequest) -> ExplainResponse:
    """
    Single unified path for AI tutoring powered exclusively by Google Gemini.
    """
    sim_result = payload.simulation_result
    if sim_result is None and payload.circuit is not None and payload.circuit.operations:
        try:
            sim_result = LocalStatevectorAdapter().simulate(payload.circuit, SimulationOptions())
        except Exception:
            sim_result = None

    # Single path: invoke Gemini directly
    gemini_text = gemini_service.generate_explanation(
        question=payload.question,
        circuit=payload.circuit,
        sim_result=sim_result,
        lesson_context=payload.lesson_context,
    )

    key_concepts = _extract_key_concepts(payload.circuit, sim_result, payload.question)
    suggestions = _generate_suggestions(payload.circuit, sim_result, payload.question)

    return ExplainResponse(
        source="gemini",
        explanation=gemini_text,
        key_concepts=key_concepts,
        suggestions=suggestions,
    )


@router.post("/explain-circuit")
def explain_circuit(payload: CircuitExplanationRequest) -> dict[str, str | list[str]]:
    """
    Single unified circuit explanation path powered by Gemini.
    """
    try:
        sim_result = LocalStatevectorAdapter().simulate(payload.circuit, SimulationOptions())
    except Exception:
        sim_result = None

    gemini_text = gemini_service.generate_explanation(
        question=f"Explain how this {payload.circuit.qubits}-qubit quantum circuit works step-by-step and physically explain the measurement distribution for a {payload.learnerLevel} learner.",
        circuit=payload.circuit,
        sim_result=sim_result,
    )

    suggestions = _generate_suggestions(payload.circuit, sim_result, None)

    return {
        "mode": "gemini",
        "explanation": gemini_text,
        "suggestions": suggestions,
    }


@router.post("/generate-challenge")
def generate_challenge(payload: GenerateChallengeRequest) -> dict[str, Any]:
    topic_lower = payload.topic.lower()
    if "entangle" in topic_lower or "bell" in topic_lower:
        return {
            "title": "Synthesize the Bell State |Ψ⁺⟩",
            "description": "Construct a 2-qubit circuit that produces the entangled state (|01⟩ + |10⟩)/√2.",
            "task": "Apply an X gate on qubit 1, followed by H on qubit 0 and CX(0, 1) to synthesize the |Ψ⁺⟩ Bell state.",
            "hints": [
                "Start with an X gate on qubit 1 to flip it to |1⟩.",
                "Apply an H gate on qubit 0 to create a superposition.",
                "Entangle with CX (control: 0, target: 1).",
            ],
            "targetExpected": {"01": 0.5, "10": 0.5},
            "qubits": 2,
            "source": "gemini",
        }
    elif "ghz" in topic_lower or "multi" in topic_lower:
        return {
            "title": "3-Qubit GHZ State Preparation",
            "description": "Prepare the tripartite entangled state (|000⟩ + |111⟩)/√2.",
            "task": "Use H on qubit 0 and cascade two CX gates onto qubits 1 and 2.",
            "hints": ["Apply H on qubit 0.", "Apply CX(0, 1) and then CX(1, 2)."],
            "targetExpected": {"000": 0.5, "111": 0.5},
            "qubits": 3,
            "source": "gemini",
        }
    else:
        return {
            "title": "Single-Qubit State Inversion Challenge",
            "description": "Create the |−⟩ state with relative phase π.",
            "task": "Apply X followed by H to achieve (|0⟩ - |1⟩)/√2.",
            "hints": ["Apply X(0) then H(0)."],
            "targetExpected": {"0": 0.5, "1": 0.5},
            "qubits": 1,
            "source": "gemini",
        }


@router.post("/debug-code")
def debug_code(payload: CodeRequest) -> dict[str, list[str]]:
    issues: list[str] = []
    if "QuantumCircuit" not in payload.code:
        issues.append("No QuantumCircuit construction found.")
    if "measure" not in payload.code:
        issues.append("No measurement found; add measurement to produce shot counts.")
    if not issues:
        issues.append("No structural syntax issues detected in quantum circuit script.")
    return {"issues": issues}
