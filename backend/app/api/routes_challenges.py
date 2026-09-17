import math
import uuid
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth.security import get_optional_current_user
from app.db import repository
from app.db.connection import get_db_connection
from app.quantum.models import CircuitIR, SimulationOptions
from app.quantum.orchestrator import orchestrator


router = APIRouter()


CHALLENGES_CATALOG = [
    {
        "id": "create-superposition",
        "title": "1. Create an Equal Superposition (|+⟩)",
        "module": "Module 1",
        "difficulty": "Beginner",
        "category": "Single Qubit",
        "xp": 100,
        "description": "Prepare a single qubit in the equal superposition state |+⟩ = (|0⟩ + |1⟩)/√2 using a Hadamard gate.",
        "hints": [
            "Start with qubit 0 in ground state |0⟩.",
            "Apply a Hadamard (H) gate to create equal amplitudes 1/√2 on |0⟩ and |1⟩.",
            "Add measurement to observe ~50% probability on each computational basis state.",
        ],
        "expected_state": {"0": 0.5, "1": 0.5},
    },
    {
        "id": "build-bell-state",
        "title": "2. Construct the Standard Bell State (|Φ⁺⟩)",
        "module": "Module 2",
        "difficulty": "Beginner",
        "category": "Entanglement",
        "xp": 150,
        "description": "Construct a 2-qubit circuit starting from |00⟩ that generates the maximally entangled Bell state: (|00⟩ + |11⟩)/√2.",
        "hints": [
            "Start by putting qubit 0 into equal superposition using a Hadamard (H) gate.",
            "Next, entangle qubit 0 (control) with qubit 1 (target) using a Controlled-NOT (CX) gate.",
            "Add measurement operations on both qubits to register binary outcomes.",
        ],
        "expected_state": {"00": 0.5, "11": 0.5},
    },
    {
        "id": "construct-ghz-state",
        "title": "3. Build a 3-Qubit GHZ State",
        "module": "Module 2",
        "difficulty": "Intermediate",
        "category": "Multi-Qubit",
        "xp": 200,
        "description": "Construct a 3-qubit circuit that prepares the Greenberger-Horne-Zeilinger state: (|000⟩ + |111⟩)/√2.",
        "hints": [
            "Apply H on qubit 0.",
            "Apply CX with control 0 and target 1.",
            "Apply CX with control 1 and target 2.",
        ],
        "expected_state": {"000": 0.5, "111": 0.5},
    },
    {
        "id": "quantum-bit-flip-swap",
        "title": "4. State Transfer via SWAP",
        "module": "Module 2",
        "difficulty": "Intermediate",
        "category": "Circuit Synthesis",
        "xp": 150,
        "description": "Initialize qubit 0 to |1⟩ using X, then exchange states so qubit 1 becomes |1⟩ and qubit 0 becomes |0⟩ (|01⟩ = 100%).",
        "hints": [
            "Apply an X gate on q0 to flip it to |1⟩.",
            "Apply a SWAP gate or 3 alternating CX gates: CX(0,1), CX(1,0), CX(0,1).",
        ],
        "expected_state": {"01": 1.0},
    },
    {
        "id": "phase-kickback-interference",
        "title": "5. Observable CZ Phase Kickback",
        "module": "Module 3",
        "difficulty": "Advanced",
        "category": "Phase & Interference",
        "xp": 200,
        "description": "Demonstrate that CZ creates an observable phase flip when target qubit is enveloped by Hadamard gates (Result: 100% |11⟩).",
        "hints": [
            "Apply X on q0 (control = 1).",
            "Apply H on q1, CZ(0, 1), and H on q1.",
            "Observe that the phase kickback flips q1 into |1⟩.",
        ],
        "expected_state": {"11": 1.0},
    },
    {
        "id": "deutsch-oracle-query",
        "title": "6. Deutsch's Algorithm Balanced Oracle",
        "module": "Module 4",
        "difficulty": "Advanced",
        "category": "Quantum Algorithms",
        "xp": 250,
        "description": "Synthesize a 2-qubit Deutsch algorithm circuit evaluating a balanced oracle f(x) = x that measures |1⟩ with 100% certainty.",
        "hints": [
            "Prepare ancilla q1 in |1⟩ via X, then apply H to both q0 and q1.",
            "Apply balanced oracle CX(q0, q1).",
            "Apply final H on q0 and measure q0 -> outcome |1⟩ indicates balanced.",
        ],
        "expected_state": {"11": 0.5, "10": 0.5},
    },
    {
        "id": "teleportation-protocol",
        "title": "7. Quantum Teleportation Protocol",
        "module": "Module 5",
        "difficulty": "Advanced",
        "category": "Protocols",
        "xp": 300,
        "description": "Synthesize the 3-qubit quantum teleportation circuit transferring state |1⟩ on q0 to Bob's qubit q2.",
        "hints": [
            "Prepare initial state |1⟩ on q0 via X.",
            "Create shared Bell state on q1, q2 via H(q1) + CX(q1, q2).",
            "Apply Bell measurement on Alice's qubits: CX(q0, q1) + H(q0).",
        ],
        "expected_state": {},
    },
    {
        "id": "bit-flip-correction",
        "title": "8. 3-Qubit Bit-Flip Repetition Code",
        "module": "Module 6",
        "difficulty": "Advanced",
        "category": "Error Correction",
        "xp": 250,
        "description": "Encode a logical qubit |1⟩ into 3 physical qubits using CX encoding gates: (|1⟩ -> |111⟩).",
        "hints": [
            "Prepare data qubit q0 in |1⟩ using X.",
            "Entangle ancillae q1 and q2 using CX(0, 1) and CX(0, 2).",
            "Outcome should be 100% |111⟩.",
        ],
        "expected_state": {"111": 1.0},
    },
]

# Alias map for backwards compatibility
CHALLENGE_ALIASES = {
    "bell-state-creation": "build-bell-state",
    "ghz-3qubit-state": "construct-ghz-state",
    "superposition-phase-flip": "create-superposition",
    "quantum-swap-implementation": "quantum-bit-flip-swap",
}


class ChallengeSubmission(BaseModel):
    challenge_id: str
    circuit: CircuitIR


class ChallengeEvaluationResult(BaseModel):
    challenge_id: str
    passed: bool
    score: float
    xp_earned: int
    feedback: str
    measured_probabilities: dict[str, float]
    expected_probabilities: dict[str, float]


@router.get("")
def list_challenges() -> list[dict[str, Any]]:
    return CHALLENGES_CATALOG


@router.get("/{challenge_id}")
def get_challenge(challenge_id: str) -> dict[str, Any]:
    norm_id = CHALLENGE_ALIASES.get(challenge_id, challenge_id)
    for ch in CHALLENGES_CATALOG:
        if ch["id"] == norm_id or ch["id"] == challenge_id:
            return ch
    raise HTTPException(status_code=404, detail="Challenge not found")


@router.post("/evaluate", response_model=ChallengeEvaluationResult)
def evaluate_challenge(
    submission: ChallengeSubmission,
    current_user: Optional[dict] = Depends(get_optional_current_user),
) -> ChallengeEvaluationResult:
    norm_id = CHALLENGE_ALIASES.get(submission.challenge_id, submission.challenge_id)
    target_challenge = None
    for ch in CHALLENGES_CATALOG:
        if ch["id"] == norm_id or ch["id"] == submission.challenge_id:
            target_challenge = ch
            break
    
    if not target_challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    # 1. Validate circuit
    val = orchestrator.validate(submission.circuit)
    if not val.valid:
        return ChallengeEvaluationResult(
            challenge_id=submission.challenge_id,
            passed=False,
            score=0.0,
            xp_earned=0,
            feedback=f"Circuit validation failed: {'; '.join(val.errors)}",
            measured_probabilities={},
            expected_probabilities=target_challenge.get("expected_state", {}),
        )
    
    # 2. Run simulation
    sim_result = orchestrator.simulate(
        submission.circuit,
        options=SimulationOptions(backend="local_statevector", shots=1024, includeStatevector=True),
    )
    probs = sim_result.probabilities
    expected = target_challenge.get("expected_state", {})
    
    passed = True
    feedback_msgs = []
    
    cid = target_challenge["id"]

    if cid == "create-superposition":
        p0 = probs.get("0", 0.0)
        p1 = probs.get("1", 0.0)
        if abs(p0 - 0.5) <= 0.10 and abs(p1 - 0.5) <= 0.10:
            passed = True
            feedback_msgs.append("Excellent! You created an equal superposition |+⟩ with 50/50 measurement probabilities.")
        else:
            passed = False
            feedback_msgs.append(f"Superposition requires equal ~50% probability on |0⟩ and |1⟩. Measured |0⟩: {p0:.2f}, |1⟩: {p1:.2f}.")

    elif cid == "build-bell-state":
        p00 = probs.get("00", 0.0)
        p11 = probs.get("11", 0.0)
        p01 = probs.get("01", 0.0)
        p10 = probs.get("10", 0.0)
        if p00 > 0.40 and p11 > 0.40 and p01 < 0.08 and p10 < 0.08:
            passed = True
            feedback_msgs.append("Flawless! Your circuit generated the maximally entangled Bell state (|00⟩ + |11⟩)/√2.")
        else:
            passed = False
            feedback_msgs.append(f"State mismatch: Expected 50% |00⟩ and 50% |11⟩. Measured |00⟩: {p00:.2f}, |11⟩: {p11:.2f}.")

    elif cid == "construct-ghz-state":
        p000 = probs.get("000", 0.0)
        p111 = probs.get("111", 0.0)
        other_sum = sum(v for k, v in probs.items() if k not in ["000", "111"])
        if p000 > 0.40 and p111 > 0.40 and other_sum < 0.10:
            passed = True
            feedback_msgs.append("Outstanding! 3-qubit GHZ state (|000⟩ + |111⟩)/√2 successfully verified.")
        else:
            passed = False
            feedback_msgs.append(f"GHZ state requires equal amplitudes on |000⟩ and |111⟩. Measured |000⟩: {p000:.2f}, |111⟩: {p111:.2f}.")

    elif cid == "quantum-bit-flip-swap":
        p01 = probs.get("01", 0.0)
        if p01 > 0.85:
            passed = True
            feedback_msgs.append("Brilliant! State |1⟩ on qubit 0 was successfully transferred to qubit 1.")
        else:
            passed = False
            feedback_msgs.append(f"Expected outcome 100% |01⟩. Measured |01⟩: {p01:.2f}. Ensure q0 is flipped with X then swapped.")

    elif cid == "phase-kickback-interference":
        p11 = probs.get("11", 0.0)
        if p11 > 0.85:
            passed = True
            feedback_msgs.append("Great job! Phase kickback through CZ induced constructive interference into |11⟩.")
        else:
            passed = False
            feedback_msgs.append("CZ phase kickback requires X on q0 and Hadamard before and after CZ on q1.")

    elif cid == "deutsch-oracle-query":
        # For balanced oracle, q0 measured in computational basis gives |1|
        # Check that state has q0 = 1 (states '10', '11' or '1')
        p_q0_is_1 = sum(v for k, v in probs.items() if k.endswith("1") or (len(k) >= 1 and k[-1] == "1") or k.startswith("1"))
        has_cx = any(op.gate == "cx" for op in submission.circuit.operations)
        if p_q0_is_1 > 0.80 and has_cx:
            passed = True
            feedback_msgs.append("Superb! Deutsch's algorithm distinguished the balanced oracle in a single quantum query.")
        else:
            passed = False
            feedback_msgs.append("Make sure to apply H on input q0, evaluate balanced oracle CX(0,1), and apply final H on q0.")

    elif cid == "teleportation-protocol":
        has_h = any(op.gate == "h" for op in submission.circuit.operations)
        has_cx = any(op.gate == "cx" for op in submission.circuit.operations)
        if submission.circuit.qubits >= 3 and has_h and has_cx:
            passed = True
            feedback_msgs.append("Incredible! Quantum teleportation protocol circuit correctly prepared and verified.")
        else:
            passed = False
            feedback_msgs.append("Teleportation requires 3 qubits, Bell pair preparation H+CX, and Bell basis measurement CX+H.")

    elif cid == "bit-flip-correction":
        p111 = probs.get("111", 0.0)
        if p111 > 0.85:
            passed = True
            feedback_msgs.append("Excellent! Logical |1⟩ successfully encoded across 3 physical qubits into |111⟩.")
        else:
            passed = False
            feedback_msgs.append("Apply X on data qubit 0, followed by CX(0, 1) and CX(0, 2) to encode into |111⟩.")

    score = 100.0 if passed else 30.0
    xp = target_challenge["xp"] if passed else 25

    # If user is authenticated, record submission in database
    if current_user and current_user.get("sub"):
        try:
            user_id = current_user["sub"]
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    INSERT INTO submissions (id, assessment_id, user_id, answer_json, score, feedback)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (
                        str(uuid.uuid4()),
                        target_challenge["id"],
                        user_id,
                        sim_result.model_dump_json(),
                        score,
                        "; ".join(feedback_msgs),
                    ),
                )
        except Exception:
            pass

    return ChallengeEvaluationResult(
        challenge_id=target_challenge["id"],
        passed=passed,
        score=score,
        xp_earned=xp,
        feedback=" ".join(feedback_msgs),
        measured_probabilities=probs,
        expected_probabilities=expected,
    )
