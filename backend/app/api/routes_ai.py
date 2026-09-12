import json
import os
import urllib.error
import urllib.request
from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.quantum.adapters.local_statevector import LocalStatevectorAdapter
from app.quantum.models import CircuitIR, SimulationOptions, SimulationResult

router = APIRouter()


class LessonContext(BaseModel):
    title: str | None = None
    objective: str | None = None


class ExplainRequest(BaseModel):
    circuit: CircuitIR
    simulation_result: SimulationResult | None = None
    lesson_context: LessonContext | None = None
    question: str | None = None


class ExplainResponse(BaseModel):
    source: Literal["llm", "fallback"]
    explanation: str
    key_concepts: list[str] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)


class CircuitExplanationRequest(BaseModel):
    circuit: CircuitIR
    learnerLevel: str = "beginner"


class CodeRequest(BaseModel):
    code: str
    framework: str = "qiskit"


def _build_llm_prompt(payload: ExplainRequest, sim_result: SimulationResult) -> str:
    ops_desc = []
    for i, op in enumerate(payload.circuit.operations):
        g = op.gate.upper()
        if op.controls:
            ops_desc.append(f"Step {i+1}: {g} (control: qubit {op.controls[0]}, target: qubit {op.targets[0]})")
        elif len(op.targets) > 1 and g == "SWAP":
            ops_desc.append(f"Step {i+1}: SWAP (qubits {op.targets[0]} and {op.targets[1]})")
        elif op.params:
            ops_desc.append(f"Step {i+1}: {g}({op.params[0]:.3f}) on qubit {op.targets[0]}")
        elif op.gate == "measure":
            targets_str = ", ".join(f"q{t}->c{c}" for t, c in zip(op.targets, op.classicalTargets or op.targets))
            ops_desc.append(f"Step {i+1}: Measure ({targets_str})")
        else:
            ops_desc.append(f"Step {i+1}: {g} on qubit {op.targets[0]}")

    prob_desc = ", ".join(f"|{basis}⟩: {prob*100:.1f}%" for basis, prob in sim_result.probabilities.items())

    lesson_info = ""
    if payload.lesson_context:
        lesson_info = f"\nLesson Module: {payload.lesson_context.title or 'N/A'}\nLesson Objective: {payload.lesson_context.objective or 'N/A'}"

    user_query = payload.question.strip() if payload.question and payload.question.strip() else "Explain how this quantum circuit works step-by-step and why these measurement probabilities occur."

    prompt = (
        f"You are SAMBHAV's AI Quantum Physics Tutor for students learning quantum computing.\n"
        f"Analyze the following quantum circuit and simulation results carefully:\n\n"
        f"Circuit Configuration:\n"
        f"- Total Qubits: {payload.circuit.qubits}\n"
        f"- Operations:\n" + "\n".join(f"  {op}" for op in ops_desc) + "\n\n"
        f"Simulation Outcome:\n"
        f"- Dirac Statevector: {sim_result.dirac or 'N/A'}\n"
        f"- Measurement Probabilities: {prob_desc or 'N/A'}\n"
        f"{lesson_info}\n\n"
        f"Student Question: {user_query}\n\n"
        f"Instructions:\n"
        f"1. Provide a clear, pedagogical, step-by-step explanation answering the student's question.\n"
        f"2. Explain the physical role of key gates (e.g. Hadamard creates superposition, CX creates entanglement, CZ applies phase).\n"
        f"3. Keep the tone encouraging, concise (2-4 paragraphs), and mathematically accurate without overwhelming jargon."
    )
    return prompt


def _query_llm(payload: ExplainRequest, sim_result: SimulationResult) -> ExplainResponse | None:
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return None

    prompt = _build_llm_prompt(payload, sim_result)
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    body = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 600,
        },
    }).encode("utf-8")

    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=4.0) as response:
            if response.status == 200:
                res_data = json.loads(response.read().decode("utf-8"))
                candidates = res_data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts and "text" in parts[0]:
                        explanation_text = parts[0]["text"].strip()
                        key_concepts = _extract_key_concepts(payload.circuit, sim_result)
                        suggestions = _generate_suggestions(payload.circuit, sim_result)
                        return ExplainResponse(
                            source="llm",
                            explanation=explanation_text,
                            key_concepts=key_concepts,
                            suggestions=suggestions,
                        )
    except Exception:
        # LLM failed or timed out — return None to use deterministic fallback
        return None
    return None


def _extract_key_concepts(circuit: CircuitIR, sim_result: SimulationResult) -> list[str]:
    concepts: list[str] = []
    gates = [op.gate.lower() for op in circuit.operations]

    if "h" in gates:
        concepts.append("Quantum Superposition")
    if "cx" in gates:
        if "h" in gates and circuit.qubits >= 2:
            concepts.append("Bell State |Φ⁺⟩")
            concepts.append("Quantum Entanglement")
        else:
            concepts.append("Controlled-NOT (CX)")
    if "cz" in gates:
        concepts.append("Controlled-Phase (CZ)")
        concepts.append("Quantum Phase")
    if "swap" in gates:
        concepts.append("SWAP State Exchange")
    if any(g in {"rx", "ry", "rz"} for g in gates):
        concepts.append("Continuous Bloch Rotation")
    if not concepts:
        concepts.append("Computational Basis State")
    return concepts[:4]


def _generate_suggestions(circuit: CircuitIR, sim_result: SimulationResult) -> list[str]:
    gates = [op.gate.lower() for op in circuit.operations]
    suggestions: list[str] = []

    if circuit.qubits >= 2 and gates[:2] == ["h", "cx"]:
        suggestions.append("Run the simulation to observe correlated 50% |00⟩ and 50% |11⟩ outcomes.")
        suggestions.append("Remove the CX gate to see independent superposition without entanglement.")
        suggestions.append("Add an X gate before H to create the |Ψ⁺⟩ or |Φ⁻⟩ Bell state.")
    elif "h" in gates:
        suggestions.append("Apply a second H gate on the same qubit to see destructive interference restore |0⟩.")
        suggestions.append("Inspect the statevector table to verify equal real amplitudes (0.707).")
    elif "cz" in gates:
        suggestions.append("Surround the CZ gate with H gates on target to turn phase into measurable probability.")
    elif "swap" in gates:
        suggestions.append("Initialize qubit 0 with an X gate and observe SWAP move the state to qubit 1.")
    else:
        suggestions.append("Add an H gate to place a qubit into quantum superposition.")
        suggestions.append("Add a CX gate between two qubits to create entanglement.")

    return suggestions[:3]


def _generate_deterministic_explanation(payload: ExplainRequest, sim_result: SimulationResult) -> ExplainResponse:
    gates = [op.gate.lower() for op in payload.circuit.operations]
    question_lower = (payload.question or "").lower()

    key_concepts = _extract_key_concepts(payload.circuit, sim_result)
    suggestions = _generate_suggestions(payload.circuit, sim_result)

    # 1. Answer specific student questions if provided
    if "entangle" in question_lower or "bell" in question_lower or "correlat" in question_lower:
        if circuit_has_entanglement := ("cx" in gates or "cz" in gates):
            explanation = (
                "This circuit creates quantum entanglement through the combination of superposition and a conditional two-qubit gate.\n\n"
                "1. Superposition: The Hadamard (H) gate puts the control qubit into an equal superposition state: (|0⟩ + |1⟩)/√2.\n"
                "2. Conditional Entangling: The Controlled-NOT (CX) gate flips the target qubit if and only if the control qubit is |1⟩.\n"
                "3. Non-separable State: Because the control qubit is in superposition, this transforms the separate qubits into the Bell state "
                "|Φ⁺⟩ = (|00⟩ + |11⟩)/√2.\n\n"
                "Measurement yields 50% |00⟩ and 50% |11⟩ with 0% probability of |01⟩ or |10⟩. Measuring one qubit instantly determines the state of the other."
            )
        else:
            explanation = (
                "Currently, this circuit does not contain two-qubit entangling gates (such as CX or CZ). "
                "To create entanglement, place a Hadamard (H) gate on qubit 0 to create superposition, followed by a CX gate with control on qubit 0 and target on qubit 1."
            )
        return ExplainResponse(source="fallback", explanation=explanation, key_concepts=key_concepts, suggestions=suggestions)

    if "superposition" in question_lower or "hadamard" in question_lower or "h gate" in question_lower:
        explanation = (
            "The Hadamard (H) gate transforms a qubit from the computational basis (|0⟩, |1⟩) into the superposition basis (|+⟩, |-⟩).\n\n"
            "When applied to |0⟩, it creates the equal superposition state |+⟩ = (|0⟩ + |1⟩)/√2. "
            "In this state, the qubit does not have a definite 0 or 1 value until measured, yielding a 50% probability for |0⟩ and 50% probability for |1⟩."
        )
        return ExplainResponse(source="fallback", explanation=explanation, key_concepts=key_concepts, suggestions=suggestions)

    if "probability" in question_lower or "probabilities" in question_lower or "born" in question_lower or "measure" in question_lower:
        prob_summary = ", ".join(f"|{b}⟩: {p*100:.1f}%" for b, p in sim_result.probabilities.items())
        explanation = (
            f"Measurement outcomes in quantum mechanics follow the Born rule: P(x) = |⟨x|ψ⟩|².\n\n"
            f"For this circuit, the state vector {sim_result.dirac or ''} results in the following measurement probabilities: {prob_summary}. "
            "When a measurement gate is applied, the quantum superposition collapses into one of these computational basis states with the indicated probability."
        )
        return ExplainResponse(source="fallback", explanation=explanation, key_concepts=key_concepts, suggestions=suggestions)

    if "phase" in question_lower or "cz" in question_lower or "z gate" in question_lower or "kickback" in question_lower:
        explanation = (
            "Phase gates (such as Z, S, T, and CZ) introduce a complex relative phase e^(iθ) between basis states.\n\n"
            "While pure phase shifts do not change computational measurement probabilities directly, they become observable through quantum interference when combined with Hadamard gates. "
            "In a Controlled-Z (CZ) gate, a phase flip (-1) is applied exclusively to the |11⟩ state, creating entanglement in the phase domain."
        )
        return ExplainResponse(source="fallback", explanation=explanation, key_concepts=key_concepts, suggestions=suggestions)

    # 2. Default Circuit Explanations based on circuit composition
    has_bell_pattern = payload.circuit.qubits >= 2 and gates[:2] == ["h", "cx"]
    if has_bell_pattern:
        explanation = (
            "This circuit creates a maximally entangled Bell state (|Φ⁺⟩ = (|00⟩ + |11⟩)/√2).\n\n"
            "• Step 1: The Hadamard (H) gate on qubit 0 creates an equal superposition: (|0⟩ + |1⟩)/√2.\n"
            "• Step 2: The CX gate uses qubit 0 as control and qubit 1 as target, entangling the two qubits.\n"
            "• Result: The state becomes (|00⟩ + |11⟩)/√2. Measurement produces perfectly correlated outcomes (50% |00⟩ and 50% |11⟩) with zero probability of |01⟩ or |10⟩."
        )
    elif gates == ["h"]:
        explanation = (
            "This circuit creates a single-qubit equal superposition state: |+⟩ = (|0⟩ + |1⟩)/√2.\n\n"
            "The Hadamard (H) gate rotates the initial |0⟩ state on the Z-axis of the Bloch sphere to the positive X-axis. "
            "Measuring this state yields a 50% chance of |0⟩ and a 50% chance of |1⟩."
        )
    elif "swap" in gates:
        explanation = (
            "This circuit applies a SWAP gate to exchange the quantum states of two qubits.\n\n"
            "Any state |a⟩ on the first qubit and |b⟩ on the second qubit is transformed into |b⟩ ⊗ |a⟩. "
            "SWAP is essential for routing quantum information across physical qubit topologies."
        )
    else:
        ops_summary = ", ".join(op.gate.upper() for op in payload.circuit.operations)
        explanation = (
            f"The circuit applies the sequence of quantum gates [{ops_summary}] across {payload.circuit.qubits} qubit(s).\n\n"
            f"• State Evolution: The circuit transforms the initial |{'0'*payload.circuit.qubits}⟩ state into: {sim_result.dirac or 'the target statevector'}.\n"
            "• Measurement: The probabilities in the simulation panel show the likelihood of observing each basis state upon measurement."
        )

    return ExplainResponse(
        source="fallback",
        explanation=explanation,
        key_concepts=key_concepts,
        suggestions=suggestions,
    )


@router.post("/explain", response_model=ExplainResponse)
def explain(payload: ExplainRequest) -> ExplainResponse:
    # Ensure we have simulation result for context
    sim_result = payload.simulation_result
    if sim_result is None:
        sim_result = LocalStatevectorAdapter().simulate(payload.circuit, SimulationOptions())

    # Try LLM first
    llm_response = _query_llm(payload, sim_result)
    if llm_response is not None:
        return llm_response

    # Fallback to deterministic rule-based pedagogical engine
    return _generate_deterministic_explanation(payload, sim_result)


@router.post("/explain-circuit")
def explain_circuit(payload: CircuitExplanationRequest) -> dict[str, str | list[str]]:
    # Backward compatibility with existing endpoint
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
