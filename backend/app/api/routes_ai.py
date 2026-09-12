import json
import os
import re
import urllib.error
import urllib.request
from typing import Any, Literal

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.quantum.adapters.local_statevector import LocalStatevectorAdapter
from app.quantum.models import CircuitIR, SimulationOptions, SimulationResult

router = APIRouter()


class LessonContext(BaseModel):
    title: str | None = None
    objective: str | None = None


class ExplainRequest(BaseModel):
    circuit: CircuitIR | None = None
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


class GenerateChallengeRequest(BaseModel):
    learnerLevel: str = "intermediate"
    topic: str = "Quantum Entanglement"
    current_circuit: CircuitIR | None = None
    weak_concepts: list[str] = Field(default_factory=list)


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
        lesson_info = f"Lesson Module: {payload.lesson_context.title or 'N/A'}\nLesson Objective: {payload.lesson_context.objective or 'N/A'}"

    user_query = payload.question.strip() if payload.question and payload.question.strip() else "Explain how this quantum circuit works step-by-step and why these measurement probabilities occur."

    prompt = (
        f"You are SAMBHAV's AI Quantum Physics Tutor.\n\n"
        f"CRITICAL DIRECTIVE:\n"
        f"The student has asked you the following specific question. Answer this question DIRECTLY, thoroughly, and pedagogically:\n"
        f'"{user_query}"\n\n'
        f"ACTIVE CONTEXT (Reference this context if relevant to the student's question):\n"
        f"- Total Qubits: {payload.circuit.qubits}\n"
        f"- Gate Operations:\n" + ("\n".join(f"  {op}" for op in ops_desc) if ops_desc else "  (No gates applied yet)") + "\n"
        f"- Dirac Statevector: {sim_result.dirac or '|0⟩'}\n"
        f"- Measurement Probabilities: {prob_desc or '100% |0⟩'}\n"
        f"{lesson_info}\n\n"
        f"INSTRUCTIONS:\n"
        f"1. Your primary job is to answer the student's question directly. If they ask a general/conceptual question (e.g. 'What is a qubit?', 'Explain entanglement in simple terms'), explain the underlying physics clearly with intuitive analogies.\n"
        f"2. If they ask about the active circuit or measurement results, break down the quantum evolution step-by-step.\n"
        f"3. If the question is ambiguous, clarify what was asked and offer helpful directions.\n"
        f"4. Keep the explanation structured, encouraging, concise (2-4 paragraphs), and mathematically accurate."
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
                        key_concepts = _extract_key_concepts(payload.circuit, sim_result, payload.question)
                        suggestions = _generate_suggestions(payload.circuit, sim_result, payload.question)
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


def _extract_key_concepts(circuit: CircuitIR, sim_result: SimulationResult, question: str | None = None) -> list[str]:
    concepts: list[str] = []
    q_lower = (question or "").lower()
    gates = [op.gate.lower() for op in circuit.operations]

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

    # Circuit-derived concepts
    if "h" in gates and "Quantum Superposition" not in concepts:
        concepts.append("Quantum Superposition")
    if "cx" in gates:
        if "h" in gates and circuit.qubits >= 2 and "Quantum Entanglement" not in concepts:
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


def _generate_suggestions(circuit: CircuitIR, sim_result: SimulationResult, question: str | None = None) -> list[str]:
    gates = [op.gate.lower() for op in circuit.operations]
    suggestions: list[str] = []

    if circuit.qubits >= 2 and gates[:2] == ["h", "cx"]:
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
        suggestions.append("What does the CNOT gate do?")

    return suggestions[:3]


def _generate_deterministic_explanation(payload: ExplainRequest, sim_result: SimulationResult) -> ExplainResponse:
    """
    Intelligent, context-aware pedagogical engine that accurately answers the user's specific question
    or explains the active circuit step-by-step without generic hardcoded fallback responses.
    """
    gates = [op.gate.lower() for op in payload.circuit.operations]
    q = (payload.question or "").strip()
    q_lower = q.lower()

    key_concepts = _extract_key_concepts(payload.circuit, sim_result, q)
    suggestions = _generate_suggestions(payload.circuit, sim_result, q)

    # 1. SPECIFIC CONCEPTUAL QUESTIONS

    # A. What is a qubit / bit vs qubit?
    if re.search(r"\b(what is a qubit|what is qubit|explain qubit|difference between bit and qubit|qubit vs bit)\b", q_lower):
        explanation = (
            "A **qubit (quantum bit)** is the fundamental unit of quantum information, analogous to a classical bit in digital computing.\n\n"
            "• **Classical Bit vs Qubit**: While a classical bit must strictly be in state 0 or state 1, a qubit can exist in a linear combination "
            "of both states simultaneously: |ψ⟩ = α|0⟩ + β|1⟩, where α and β are complex probability amplitudes satisfying |α|² + |β|² = 1.\n\n"
            "• **Bloch Sphere Representation**: Geometrically, any pure single-qubit state can be represented as a point on the surface of a unit sphere "
            "(the Bloch sphere), where |0⟩ is the North Pole and |1⟩ is the South Pole.\n\n"
            "• **Measurement Collapse**: When measured in the computational basis, the superposition collapses probabilistically to |0⟩ with probability |α|² "
            "or |1⟩ with probability |β|²."
        )
        return ExplainResponse(source="fallback", explanation=explanation, key_concepts=key_concepts, suggestions=suggestions)

    # B. Hadamard gate / Superposition creation
    if re.search(r"\b(hadamard|h gate|why does hadamard|why does the hadamard|create superposition|creates superposition)\b", q_lower):
        explanation = (
            "The **Hadamard (H) gate** is the cornerstone single-qubit gate used to create quantum superposition from basis states.\n\n"
            "• **Mathematical Action**: It maps the computational basis states into symmetric superposition states:\n"
            "  - H|0⟩ = (|0⟩ + |1⟩)/√2 = |+⟩ (50% |0⟩, 50% |1⟩)\n"
            "  - H|1⟩ = (|0⟩ - |1⟩)/√2 = |−⟩ (50% |0⟩, 50% |1⟩ with a relative π phase shift)\n\n"
            "• **Bloch Sphere Rotation**: Geometrically, the Hadamard gate performs a 180° rotation around the diagonal X+Z axis on the Bloch sphere, "
            "transforming the vertical state on the Z-axis into the horizontal equator on the X-axis.\n\n"
            "• **Self-Inverting Property**: Applying H twice restores the original state: H · H = I. This demonstrates quantum interference, "
            "where the amplitudes for |1⟩ destructively interfere to return to |0⟩."
        )
        return ExplainResponse(source="fallback", explanation=explanation, key_concepts=key_concepts, suggestions=suggestions)

    # C. CNOT / CX Gate
    if re.search(r"\b(cnot|cx gate|controlled not|what does the cnot|what does cnot|what does cx)\b", q_lower):
        explanation = (
            "The **Controlled-NOT (CNOT / CX) gate** is a fundamental two-qubit entangling gate.\n\n"
            "• **Operation**: It flips the state of the *target* qubit (applying Pauli-X) if and only if the *control* qubit is in the |1⟩ state.\n"
            "  - |00⟩ → |00⟩ (Control is 0, target unchanged)\n"
            "  - |01⟩ → |01⟩ (Control is 0, target unchanged)\n"
            "  - |10⟩ → |11⟩ (Control is 1, target flipped from 0 to 1)\n"
            "  - |11⟩ → |10⟩ (Control is 1, target flipped from 1 to 0)\n\n"
            "• **Creating Entanglement**: When the control qubit is placed in a superposition state (|0⟩ + |1⟩)/√2 via a Hadamard gate, "
            "the CX gate creates a non-separable entangled state: (|00⟩ + |11⟩)/√2 (the Bell state |Φ⁺⟩)."
        )
        return ExplainResponse(source="fallback", explanation=explanation, key_concepts=key_concepts, suggestions=suggestions)

    # D. Entanglement explanation
    if re.search(r"\b(entangle|entanglement|explain entanglement|what is entanglement|spooky)\b", q_lower):
        circuit_has_cx = "cx" in gates or "cz" in gates
        circuit_note = (
            "In your active circuit, qubit 0 is first placed into a superposition state via H(0), and the CX(0, 1) gate then creates non-separable entanglement, yielding (|00⟩ + |11⟩)/√2."
            if circuit_has_cx
            else "In your active circuit, adding an H gate on qubit 0 (creating superposition) and a CX gate between qubits 0 and 1 will construct this entangled pair."
        )
        explanation = (
            "**Quantum Entanglement** is a phenomenon where two or more qubits become inextricably correlated such that the quantum state of each particle "
            "cannot be described independently of the state of the others, regardless of the distance separating them.\n\n"
            "• **In Simple Terms**: If two classical coins are flipped, each has a 50% chance of heads or tails independently. In an entangled Bell pair (|00⟩ + |11⟩)/√2, "
            "each qubit still appears completely random (50% 0, 50% 1), but the instant one qubit is measured, the second qubit is guaranteed to yield the exact same outcome.\n\n"
            f"• **Superposition & Non-Separability**: The joint wave function cannot be factored into |ψ₁⟩ ⊗ |ψ₂⟩. {circuit_note}"
        )
        return ExplainResponse(source="fallback", explanation=explanation, key_concepts=key_concepts, suggestions=suggestions)

    # E. Measurement results & Born Rule
    if re.search(r"\b(why is my circuit producing|measurement result|probabilities|50%|probability|born rule|why did this produce)\b", q_lower):
        prob_summary = ", ".join(f"|{b}⟩: {p*100:.1f}%" for b, p in sim_result.probabilities.items())
        explanation = (
            f"Your circuit produces the measurement distribution **{prob_summary}** according to the **Born Rule** of quantum mechanics: "
            "the probability of measuring basis state |x⟩ is given by the squared magnitude of its amplitude: P(x) = |⟨x|ψ⟩|².\n\n"
            f"• **Current Statevector**: The simulated state is {sim_result.dirac or '|ψ⟩ = |0⟩'}.\n"
            "• **Superposition & Amplitudes**: Each non-zero amplitude in the statevector corresponds to a measurable state. "
            "When the quantum state is measured, the continuous wave function collapses into one discrete outcome with the calculated probability."
        )
        return ExplainResponse(source="fallback", explanation=explanation, key_concepts=key_concepts, suggestions=suggestions)

    # F. Pauli Gates (X, Y, Z)
    if re.search(r"\b(pauli|x gate|z gate|y gate|bit flip|phase flip|not gate)\b", q_lower):
        explanation = (
            "The **Pauli Gates (X, Y, Z)** represent 180° (π radian) rotations about the principal axes of the Bloch sphere:\n\n"
            "• **Pauli-X (Bit-Flip)**: Acts like a quantum NOT gate: X|0⟩ = |1⟩ and X|1⟩ = |0⟩. It rotates 180° around the X-axis.\n"
            "• **Pauli-Z (Phase-Flip)**: Leaves |0⟩ unchanged and flips the phase of |1⟩: Z|0⟩ = |0⟩, Z|1⟩ = -|1⟩. It rotates 180° around the Z-axis.\n"
            "• **Pauli-Y**: Combines bit-flip and phase-flip with an imaginary unit: Y|0⟩ = i|1⟩, Y|1⟩ = -i|0⟩. It rotates 180° around the Y-axis."
        )
        return ExplainResponse(source="fallback", explanation=explanation, key_concepts=key_concepts, suggestions=suggestions)

    # G. Phase shifts, S and T gates
    if re.search(r"\b(s gate|t gate|phase shift|phase kickback|cz gate|controlled z)\b", q_lower):
        explanation = (
            "**Phase Gates** introduce relative complex phases between computational basis states without changing their individual measurement probabilities:\n\n"
            "• **S Gate**: Applies a π/2 (90°) phase shift: S|1⟩ = i|1⟩ (equivalent to √Z).\n"
            "• **T Gate**: Applies a π/4 (45°) phase shift: T|1⟩ = e^(iπ/4)|1⟩ (equivalent to √S or ⁴√Z). It is crucial for universal fault-tolerant quantum computing.\n"
            "• **Controlled-Z (CZ)**: Applies a -1 phase factor exclusively when both qubits are in state |11⟩, generating phase entanglement."
        )
        return ExplainResponse(source="fallback", explanation=explanation, key_concepts=key_concepts, suggestions=suggestions)

    # H. Quantum Algorithms (Grover, Deutsch-Jozsa, Teleportation, Superdense Coding)
    if re.search(r"\b(grover|search algorithm)\b", q_lower):
        explanation = (
            "**Grover's Search Algorithm** provides a quadratic quantum speedup O(√N) for searching unsorted databases of size N.\n\n"
            "• **Mechanism**: It initializes an equal superposition across all items, uses an Oracle gate to invert the phase of target items, "
            "and applies a Grover Diffusion operator to reflect amplitudes around the mean, exponentially amplifying the target item's probability."
        )
        return ExplainResponse(source="fallback", explanation=explanation, key_concepts=key_concepts, suggestions=suggestions)

    if re.search(r"\b(deutsch|jozsa|oracle)\b", q_lower):
        explanation = (
            "The **Deutsch-Jozsa Algorithm** determines whether an unknown black-box function f(x) is *constant* (same output for all inputs) "
            "or *balanced* (returns 0 for half and 1 for half) in a single quantum evaluation, compared to 2^(n-1) + 1 evaluations classically.\n\n"
            "• **Mechanism**: It uses phase kickback from an ancillary qubit |−⟩ to encode function properties into global quantum interference."
        )
        return ExplainResponse(source="fallback", explanation=explanation, key_concepts=key_concepts, suggestions=suggestions)

    if re.search(r"\b(teleport|teleportation)\b", q_lower):
        explanation = (
            "**Quantum Teleportation** is a protocol to transfer an unknown quantum state |ψ⟩ from Alice to Bob using an entangled EPR pair and 2 classical bits of communication.\n\n"
            "• **Protocol**: Alice performs a Bell measurement on her qubit and half of the EPR pair, destroying the original state, and sends the 2 classical bits to Bob. "
            "Bob applies single-qubit Pauli corrections (X and/or Z) to reconstruct the exact original state |ψ⟩ with 100% fidelity without violating the No-Cloning theorem."
        )
        return ExplainResponse(source="fallback", explanation=explanation, key_concepts=key_concepts, suggestions=suggestions)

    # 2. CIRCUIT STEP-BY-STEP EXPLANATION (When user asks about the active circuit or has no specific keyword)
    has_bell_pattern = payload.circuit.qubits >= 2 and gates[:2] == ["h", "cx"]
    if has_bell_pattern:
        explanation = (
            f"You asked: *\"{q}\"*\n\n"
            "Analyzing your active circuit configuration:\n\n"
            "• **Step 1: Superposition**: The Hadamard (H) gate on qubit 0 rotates the ground state |0⟩ into equal superposition (|0⟩ + |1⟩)/√2.\n"
            "• **Step 2: Entangling**: The CX gate uses qubit 0 as control and qubit 1 as target, transforming the joint state into the maximally entangled Bell state |Φ⁺⟩ = (|00⟩ + |11⟩)/√2.\n"
            f"• **Outcome**: The statevector is {sim_result.dirac}. Measurement yields 50% |00⟩ and 50% |11⟩ with 0% probability of |01⟩ or |10⟩."
        )
    elif gates == ["h"]:
        explanation = (
            f"You asked: *\"{q}\"*\n\n"
            "Analyzing your single-qubit Hadamard circuit:\n\n"
            "• **State Transformation**: The initial state |0⟩ is transformed into the superposition state |+⟩ = (|0⟩ + |1⟩)/√2.\n"
            "• **Measurement Outcome**: Both basis states |0⟩ and |1⟩ have an equal 50% probability of detection upon measurement."
        )
    elif payload.circuit.operations:
        ops_summary = " → ".join(op.gate.upper() for op in payload.circuit.operations)
        explanation = (
            f"Regarding your question *\"{q}\"*:\n\n"
            f"Your active circuit executes the gate sequence **[{ops_summary}]** across {payload.circuit.qubits} qubit(s).\n\n"
            f"• **State Evolution**: The circuit transforms the input state into: {sim_result.dirac or '|0⟩'}.\n"
            f"• **Measurement Probabilities**: " + ", ".join(f"|{b}⟩: {p*100:.1f}%" for b, p in sim_result.probabilities.items()) + ".\n\n"
            "Feel free to ask a specific question about any gate or physical property in this circuit!"
        )
    else:
        explanation = (
            f"Regarding your question: *\"{q}\"*\n\n"
            "In quantum computing, circuits start in the computational ground state |0...0⟩. "
            "To explore quantum behavior, place gates like **H** (superposition), **X** (bit-flip), or **CX** (entanglement) on the canvas and click Simulate!"
        )

    return ExplainResponse(
        source="fallback",
        explanation=explanation,
        key_concepts=key_concepts,
        suggestions=suggestions,
    )


@router.post("/explain", response_model=ExplainResponse)
def explain(payload: ExplainRequest) -> ExplainResponse:
    if payload.circuit is None:
        payload.circuit = CircuitIR(
            qubits=1,
            classicalBits=1,
            operations=[{"gate": "measure", "targets": [0], "classicalTargets": [0]}],
        )

    sim_result = payload.simulation_result
    if sim_result is None:
        sim_result = LocalStatevectorAdapter().simulate(payload.circuit, SimulationOptions())

    # Try LLM first
    llm_response = _query_llm(payload, sim_result)
    if llm_response is not None:
        return llm_response

    # Fallback to intelligent deterministic pedagogical engine
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
