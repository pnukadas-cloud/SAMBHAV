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
    source: Literal["gemini", "llm", "fallback"]
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

    # Check question-derived concepts
    if "qubit" in q_lower or "bit" in q_lower:
        concepts.append("Quantum Bit (Qubit)")
    if "superposition" in q_lower or "hadamard" in q_lower:
        concepts.append("Quantum Superposition")
    if "entangle" in q_lower or "bell" in q_lower:
        concepts.append("Quantum Entanglement")
    if "cnot" in q_lower or "cx" in q_lower:
        concepts.append("Controlled-NOT Gate")
    if "phase" in q_lower or "kickback" in q_lower:
        concepts.append("Quantum Phase")
    if "born" in q_lower or "measure" in q_lower or "probab" in q_lower:
        concepts.append("Born Rule & Measurement Collapse")
    if "grover" in q_lower:
        concepts.append("Amplitude Amplification")
    if "teleport" in q_lower:
        concepts.append("Quantum Teleportation")
    if "hint" in q_lower:
        concepts.append("Pedagogical Guidance")

    # Circuit-derived concepts
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
        concepts.append("Computational Basis State")
    return concepts[:4]


def _generate_suggestions(circuit: Optional[CircuitIR], sim_result: Optional[SimulationResult], question: Optional[str] = None) -> list[str]:
    gates = [op.gate.lower() for op in circuit.operations] if circuit and circuit.operations else []
    suggestions: list[str] = []

    if circuit and circuit.qubits >= 2 and gates[:2] == ["h", "cx"]:
        suggestions.append("Why did this circuit create entanglement?")
        suggestions.append("What happens if you remove the CX gate?")
        suggestions.append("How do you create the other three Bell states?")
    elif "h" in gates:
        suggestions.append("Why does Hadamard create equal probabilities?")
        suggestions.append("What happens if you apply a second H gate on the same qubit?")
        suggestions.append("How does superposition differ from classical uncertainty?")
    elif "cz" in gates:
        suggestions.append("How does the Controlled-Z (CZ) gate differ from CX?")
        suggestions.append("Why does CZ apply phase kickback exclusively to |11⟩?")
    elif "swap" in gates:
        suggestions.append("How is the SWAP gate constructed using 3 CNOT gates?")
    else:
        suggestions.append("What is a qubit?")
        suggestions.append("Why does the Hadamard gate create superposition?")
        suggestions.append("Explain quantum entanglement like I'm a beginner.")

    return suggestions[:3]


def _generate_deterministic_explanation(payload: ExplainRequest, sim_result: Optional[SimulationResult] = None) -> ExplainResponse:
    """
    Pedagogical fallback engine that accurately answers the student's specific question
    or explains the active circuit step-by-step in clean, legible text without raw asterisks
    when Gemini is unconfigured, unreachable, or times out.
    """
    circuit = payload.circuit
    gates = [op.gate.lower() for op in circuit.operations] if circuit and circuit.operations else []
    q = (payload.question or "").strip()
    q_lower = q.lower()

    key_concepts = _extract_key_concepts(circuit, sim_result, q)
    suggestions = _generate_suggestions(circuit, sim_result, q)

    # 1. SPECIFIC CONCEPTUAL & TARGETED QUESTIONS

    # A. What is a qubit / bit vs qubit?
    if re.search(r"\b(what is a qubit|what is qubit|explain qubit|difference between bit and qubit|qubit vs bit)\b", q_lower):
        explanation = (
            "A qubit (quantum bit) is the fundamental unit of quantum information, analogous to a classical bit in digital computing.\n\n"
            "• Classical Bit vs Qubit: While a classical bit must strictly be in state 0 or state 1, a qubit can exist in a linear combination "
            "of both states simultaneously: |ψ⟩ = α|0⟩ + β|1⟩, where α and β are complex probability amplitudes satisfying |α|² + |β|² = 1.\n\n"
            "• Bloch Sphere Representation: Geometrically, any pure single-qubit state can be represented as a point on the surface of a unit sphere "
            "(the Bloch sphere), where |0⟩ is the North Pole and |1⟩ is the South Pole.\n\n"
            "• Measurement Collapse: When measured in the computational basis, the superposition collapses probabilistically to |0⟩ with probability |α|² "
            "or |1⟩ with probability |β|²."
        )
        return ExplainResponse(source="fallback", explanation=explanation, key_concepts=key_concepts, suggestions=suggestions)

    # B. Hadamard gate / Superposition creation
    if re.search(r"\b(hadamard|h gate|why does hadamard|why does the hadamard|create superposition|creates superposition)\b", q_lower) and not re.search(r"\bremove\b", q_lower):
        explanation = (
            "The Hadamard (H) gate is the cornerstone single-qubit gate used to create quantum superposition from basis states.\n\n"
            "• Mathematical Action: It maps the computational basis states into symmetric superposition states:\n"
            "  - H|0⟩ = (|0⟩ + |1⟩)/√2 = |+⟩ (50% |0⟩, 50% |1⟩)\n"
            "  - H|1⟩ = (|0⟩ - |1⟩)/√2 = |−⟩ (50% |0⟩, 50% |1⟩ with a relative π phase shift)\n\n"
            "• Bloch Sphere Rotation: Geometrically, the Hadamard gate performs a 180° rotation around the diagonal X+Z axis on the Bloch sphere, "
            "transforming the vertical state on the Z-axis into the horizontal equator on the X-axis.\n\n"
            "• Self-Inverting Property: Applying H twice restores the original state: H · H = I. This demonstrates quantum interference, "
            "where the amplitudes for |1⟩ destructively interfere to return to |0⟩."
        )
        return ExplainResponse(source="fallback", explanation=explanation, key_concepts=key_concepts, suggestions=suggestions)

    # C. Removing the Hadamard gate / What happens if I remove...
    if re.search(r"\b(what happens if i remove|remove the hadamard|remove hadamard|without the hadamard|remove h gate)\b", q_lower):
        if circuit and "cx" in gates:
            explanation = (
                "If you remove the Hadamard gate from this circuit:\n\n"
                "• Loss of Superposition: Qubit 0 will remain in the deterministic computational ground state |0⟩ instead of entering the superposition state (|0⟩ + |1⟩)/√2.\n\n"
                "• Effect on the CNOT Gate: Since the control qubit (qubit 0) remains |0⟩, the CNOT gate will never activate its target flip. "
                "As a result, no entanglement will be generated.\n\n"
                "• Final State & Measurement: The output statevector collapses to the unentangled ground state |00⟩ with 100% probability, "
                "completely eliminating the 50/50 superposition over |00⟩ and |11⟩."
            )
        else:
            explanation = (
                "If you remove the Hadamard gate:\n\n"
                "• The qubit will not enter a quantum superposition and will remain in its initial basis state (typically |0⟩).\n"
                "• Any subsequent measurement will deterministically yield the basis state (100% probability) rather than a 50/50 probabilistic outcome."
            )
        return ExplainResponse(source="fallback", explanation=explanation, key_concepts=key_concepts, suggestions=suggestions)

    # D. Hints / Give me a hint instead of the answer
    if re.search(r"\b(hint|give me a hint|clue|help me solve|guide me)\b", q_lower):
        if circuit and "cx" in gates and "h" not in gates:
            explanation = (
                "Here is a pedagogical hint for your current circuit:\n\n"
                "• Look at the control qubit of your CNOT gate. A CNOT gate only entangles qubits when the control qubit is in a superposition state.\n"
                "• Try placing a Hadamard (H) gate before the CNOT control to initialize equal amplitudes (|0⟩ + |1⟩)/√2, and observe how the output probabilities change!"
            )
        elif circuit and "h" in gates and "cx" not in gates and (circuit.qubits >= 2):
            explanation = (
                "Here is a pedagogical hint:\n\n"
                "• You have created superposition on qubit 0 using the H gate!\n"
                "• To link qubit 0 with qubit 1 and establish quantum correlation, add a CNOT (CX) gate with qubit 0 as control and qubit 1 as target."
            )
        else:
            lesson_title = payload.lesson_context.title if payload.lesson_context else "this concept"
            explanation = (
                f"Here is a guiding hint for {lesson_title}:\n\n"
                "• Start by analyzing the initial state of your qubits (|0...0⟩).\n"
                "• Ask yourself: Do you need equal superposition (use H), a bit-flip (use X), or multi-qubit entanglement (use CX)?\n"
                "• Check the Dirac notation in the simulation panel after placing each gate to track how probability amplitudes evolve step-by-step."
            )
        return ExplainResponse(source="fallback", explanation=explanation, key_concepts=key_concepts, suggestions=suggestions)

    # E. CNOT / CX Gate & CNOT circuit result explanation
    if re.search(r"\b(why is my cnot circuit|cnot circuit producing|why is my cnot|what does the cnot|what does cnot|what does cx|cnot gate)\b", q_lower):
        dirac_str = sim_result.dirac if sim_result and sim_result.dirac else "|ψ⟩"
        prob_str = ", ".join(f"|{b}⟩: {p*100:.1f}%" for b, p in sim_result.probabilities.items() if p > 0.001) if sim_result else "50% |00⟩, 50% |11⟩"
        explanation = (
            f"Your CNOT circuit produces the result {prob_str} (statevector: {dirac_str}) due to controlled state transformation:\n\n"
            "• How CNOT Operates: The Controlled-NOT gate flips the target qubit if and only if the control qubit is |1⟩.\n"
            "  - When control is in superposition (|0⟩ + |1⟩)/√2, CNOT applies linearity across both branches:\n"
            "  - |0⟩|0⟩ → |00⟩\n"
            "  - |1⟩|0⟩ → |11⟩\n\n"
            "• Entanglement: The resulting state (|00⟩ + |11⟩)/√2 is a non-separable Bell state. Neither qubit has an independent state; "
            "measuring qubit 0 instantly determines the state of qubit 1 with 100% correlation."
        )
        return ExplainResponse(source="fallback", explanation=explanation, key_concepts=key_concepts, suggestions=suggestions)

    # F. Entanglement explanation (beginner-friendly & general)
    if re.search(r"\b(entangle|entanglement|explain entanglement|what is entanglement|spooky)\b", q_lower):
        circuit_has_cx = "cx" in gates or "cz" in gates
        circuit_note = (
            "In your active circuit, qubit 0 is placed into superposition via H(0), and CX(0, 1) creates non-separable entanglement, yielding (|00⟩ + |11⟩)/√2."
            if circuit_has_cx
            else "To create entanglement on your canvas, apply an H gate on qubit 0 followed by a CX gate from qubit 0 to qubit 1."
        )
        explanation = (
            "Quantum Entanglement is a phenomenon where two or more qubits become inextricably correlated such that the quantum state of each particle "
            "cannot be described independently of the others, regardless of the distance separating them.\n\n"
            "• The Coin Analogy (Beginner Friendly): If two friends flip classical coins independently, each has a 50% chance of heads or tails. "
            "In an entangled pair (|00⟩ + |11⟩)/√2, both coins are linked: while each coin still looks completely random (50% 0, 50% 1), "
            "the instant one friend observes heads, the other is 100% guaranteed to observe heads.\n\n"
            f"• Non-Separability: The wave function cannot be factored into independent single-qubit states. {circuit_note}"
        )
        return ExplainResponse(source="fallback", explanation=explanation, key_concepts=key_concepts, suggestions=suggestions)

    # G. Measurement results & Born Rule
    if re.search(r"\b(why is my circuit producing|measurement result|probabilities|50%|probability|born rule|why did this produce)\b", q_lower):
        prob_summary = ", ".join(f"|{b}⟩: {p*100:.1f}%" for b, p in sim_result.probabilities.items()) if sim_result else "100% |0⟩"
        explanation = (
            f"Your circuit produces the measurement distribution {prob_summary} according to the Born Rule of quantum mechanics: "
            "the probability of measuring basis state |x⟩ is given by the squared magnitude of its amplitude: P(x) = |⟨x|ψ⟩|².\n\n"
            f"• Current Statevector: The simulated state is {sim_result.dirac if sim_result else '|ψ⟩ = |0⟩'}.\n"
            "• Superposition & Amplitudes: Each non-zero amplitude in the statevector corresponds to a measurable state. "
            "When the quantum state is measured, the continuous wave function collapses into one discrete outcome with the calculated probability."
        )
        return ExplainResponse(source="fallback", explanation=explanation, key_concepts=key_concepts, suggestions=suggestions)

    # H. Pauli Gates (X, Y, Z)
    if re.search(r"\b(pauli|x gate|z gate|y gate|bit flip|phase flip|not gate)\b", q_lower):
        explanation = (
            "The Pauli Gates (X, Y, Z) represent 180° (π radian) rotations about the principal axes of the Bloch sphere:\n\n"
            "• Pauli-X (Bit-Flip): Acts like a quantum NOT gate: X|0⟩ = |1⟩ and X|1⟩ = |0⟩. It rotates 180° around the X-axis.\n"
            "• Pauli-Z (Phase-Flip): Leaves |0⟩ unchanged and flips the phase of |1⟩: Z|0⟩ = |0⟩, Z|1⟩ = -|1⟩. It rotates 180° around the Z-axis.\n"
            "• Pauli-Y: Combines bit-flip and phase-flip with an imaginary unit: Y|0⟩ = i|1⟩, Y|1⟩ = -i|0⟩. It rotates 180° around the Y-axis."
        )
        return ExplainResponse(source="fallback", explanation=explanation, key_concepts=key_concepts, suggestions=suggestions)

    # I. Phase shifts, S and T gates
    if re.search(r"\b(s gate|t gate|phase shift|phase kickback|cz gate|controlled z)\b", q_lower):
        explanation = (
            "Phase Gates introduce relative complex phases between computational basis states without changing their individual measurement probabilities:\n\n"
            "• S Gate: Applies a π/2 (90°) phase shift: S|1⟩ = i|1⟩ (equivalent to √Z).\n"
            "• T Gate: Applies a π/4 (45°) phase shift: T|1⟩ = e^(iπ/4)|1⟩ (equivalent to √S or ⁴√Z). It is crucial for universal fault-tolerant quantum computing.\n"
            "• Controlled-Z (CZ): Applies a -1 phase factor exclusively when both qubits are in state |11⟩, generating phase entanglement."
        )
        return ExplainResponse(source="fallback", explanation=explanation, key_concepts=key_concepts, suggestions=suggestions)

    # J. Quantum Algorithms (Grover, Deutsch-Jozsa, Teleportation, Superdense Coding)
    if re.search(r"\b(grover|search algorithm)\b", q_lower):
        explanation = (
            "Grover's Search Algorithm provides a quadratic quantum speedup O(√N) for searching unsorted databases of size N.\n\n"
            "• Mechanism: It initializes an equal superposition across all items, uses an Oracle gate to invert the phase of target items, "
            "and applies a Grover Diffusion operator to reflect amplitudes around the mean, exponentially amplifying the target item's probability."
        )
        return ExplainResponse(source="fallback", explanation=explanation, key_concepts=key_concepts, suggestions=suggestions)

    if re.search(r"\b(deutsch|jozsa|oracle)\b", q_lower):
        explanation = (
            "The Deutsch-Jozsa Algorithm determines whether an unknown black-box function f(x) is constant (same output for all inputs) "
            "or balanced (returns 0 for half and 1 for half) in a single quantum evaluation, compared to 2^(n-1) + 1 evaluations classically.\n\n"
            "• Mechanism: It uses phase kickback from an ancillary qubit |−⟩ to encode function properties into global quantum interference."
        )
        return ExplainResponse(source="fallback", explanation=explanation, key_concepts=key_concepts, suggestions=suggestions)

    if re.search(r"\b(teleport|teleportation)\b", q_lower):
        explanation = (
            "Quantum Teleportation is a protocol to transfer an unknown quantum state |ψ⟩ from Alice to Bob using an entangled EPR pair and 2 classical bits of communication.\n\n"
            "• Protocol: Alice performs a Bell measurement on her qubit and half of the EPR pair, destroying the original state, and sends the 2 classical bits to Bob. "
            "Bob applies single-qubit Pauli corrections (X and/or Z) to reconstruct the exact original state |ψ⟩ with 100% fidelity without violating the No-Cloning theorem."
        )
        return ExplainResponse(source="fallback", explanation=explanation, key_concepts=key_concepts, suggestions=suggestions)

    # 2. CIRCUIT STEP-BY-STEP EXPLANATION (When user asks about the active circuit or has no specific keyword)
    has_bell_pattern = circuit and circuit.qubits >= 2 and gates[:2] == ["h", "cx"]
    if has_bell_pattern:
        explanation = (
            (f"You asked: \"{q}\"\n\n" if q else "") +
            "Analyzing your active circuit configuration:\n\n"
            "• Step 1: Superposition - The Hadamard (H) gate on qubit 0 rotates the ground state |0⟩ into equal superposition (|0⟩ + |1⟩)/√2.\n"
            "• Step 2: Entangling - The CX gate uses qubit 0 as control and qubit 1 as target, transforming the joint state into the maximally entangled Bell state |Φ⁺⟩ = (|00⟩ + |11⟩)/√2.\n"
            f"• Outcome: The statevector is {sim_result.dirac if sim_result else '(|00⟩ + |11⟩)/√2'}. Measurement yields 50% |00⟩ and 50% |11⟩ with 0% probability of |01⟩ or |10⟩."
        )
    elif gates == ["h"]:
        explanation = (
            (f"You asked: \"{q}\"\n\n" if q else "") +
            "Analyzing your single-qubit Hadamard circuit:\n\n"
            "• State Transformation: The initial state |0⟩ is transformed into the superposition state |+⟩ = (|0⟩ + |1⟩)/√2.\n"
            "• Measurement Outcome: Both basis states |0⟩ and |1⟩ have an equal 50% probability of detection upon measurement."
        )
    elif circuit and circuit.operations:
        ops_summary = " → ".join(op.gate.upper() for op in circuit.operations)
        dirac_summary = sim_result.dirac if sim_result else "|0⟩"
        prob_summary = ", ".join(f"|{b}⟩: {p*100:.1f}%" for b, p in sim_result.probabilities.items()) if sim_result else "100% |0⟩"
        explanation = (
            (f"Regarding your question \"{q}\":\n\n" if q else "") +
            f"Your active circuit executes the gate sequence [{ops_summary}] across {circuit.qubits} qubit(s).\n\n"
            f"• State Evolution: The circuit transforms the input state into: {dirac_summary}.\n"
            f"• Measurement Probabilities: {prob_summary}.\n\n"
            "Feel free to ask any specific question about any gate or physical property in this circuit!"
        )
    else:
        explanation = (
            (f"Regarding your question: \"{q}\"\n\n" if q else "") +
            "In quantum computing, circuits start in the computational ground state |0...0⟩. "
            "To explore quantum behavior, place gates like H (superposition), X (bit-flip), or CX (entanglement) on the canvas and click Simulate!"
        )

    return ExplainResponse(
        source="fallback",
        explanation=explanation,
        key_concepts=key_concepts,
        suggestions=suggestions,
    )


@router.post("/explain", response_model=ExplainResponse)
def explain(payload: ExplainRequest) -> ExplainResponse:
    sim_result = payload.simulation_result
    if sim_result is None and payload.circuit is not None and payload.circuit.operations:
        try:
            sim_result = LocalStatevectorAdapter().simulate(payload.circuit, SimulationOptions())
        except Exception:
            sim_result = None

    # 1. Attempt server-side Gemini generation via GeminiService
    gemini_text = gemini_service.generate_explanation(
        question=payload.question,
        circuit=payload.circuit,
        sim_result=sim_result,
        lesson_context=payload.lesson_context,
    )

    if gemini_text:
        key_concepts = _extract_key_concepts(payload.circuit, sim_result, payload.question)
        suggestions = _generate_suggestions(payload.circuit, sim_result, payload.question)
        return ExplainResponse(
            source="gemini",
            explanation=gemini_text,
            key_concepts=key_concepts,
            suggestions=suggestions,
        )

    # 2. Fallback to clean deterministic engine if Gemini is unconfigured, unreachable, or times out
    return _generate_deterministic_explanation(payload, sim_result)


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
            "source": "curated_fallback",
        }
    elif "ghz" in topic_lower or "multi" in topic_lower:
        return {
            "title": "3-Qubit GHZ State Preparation",
            "description": "Prepare the tripartite entangled state (|000⟩ + |111⟩)/√2.",
            "task": "Use H on qubit 0 and cascade two CX gates onto qubits 1 and 2.",
            "hints": ["Apply H on qubit 0.", "Apply CX(0, 1) and then CX(1, 2)."],
            "targetExpected": {"000": 0.5, "111": 0.5},
            "qubits": 3,
            "source": "curated_fallback",
        }
    else:
        return {
            "title": "Single-Qubit State Inversion Challenge",
            "description": "Create the |−⟩ state with relative phase π.",
            "task": "Apply X followed by H to achieve (|0⟩ - |1⟩)/√2.",
            "hints": ["Apply X(0) then H(0)."],
            "targetExpected": {"0": 0.5, "1": 0.5},
            "qubits": 1,
            "source": "curated_fallback",
        }


@router.post("/explain-circuit")
def explain_circuit(payload: CircuitExplanationRequest) -> dict[str, str | list[str]]:
    sim_result = LocalStatevectorAdapter().simulate(payload.circuit, SimulationOptions())
    exp_req = ExplainRequest(circuit=payload.circuit, simulation_result=sim_result)
    resp = _generate_deterministic_explanation(exp_req, sim_result)
    return {
        "mode": "rule_based_prototype",
        "explanation": resp.explanation,
        "suggestions": resp.suggestions,
    }


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
