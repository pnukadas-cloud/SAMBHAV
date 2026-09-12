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
        "id": "bell-state-creation",
        "title": "Construct the Bell State (|Φ⁺⟩)",
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
        "id": "ghz-3qubit-state",
        "title": "Synthesize a 3-Qubit GHZ State",
        "difficulty": "Intermediate",
        "category": "Multi-Qubit",
        "xp": 250,
        "description": "Construct a 3-qubit circuit that prepares the Greenberger-Horne-Zeilinger state: (|000⟩ + |111⟩)/√2.",
        "hints": [
            "Apply H on qubit 0.",
            "Apply CX with control 0 and target 1.",
            "Apply CX with control 1 and target 2.",
        ],
        "expected_state": {"000": 0.5, "111": 0.5},
    },
    {
        "id": "superposition-phase-flip",
        "title": "Equal Superposition with Phase Inversion (|−⟩)",
        "difficulty": "Beginner",
        "category": "Single Qubit",
        "xp": 100,
        "description": "Prepare the single-qubit |−⟩ state (|0⟩ - |1⟩)/√2 from the ground state |0⟩.",
        "hints": [
            "Apply an X gate to flip |0⟩ to |1⟩.",
            "Apply an H gate to transform |1⟩ into (|0⟩ - |1⟩)/√2.",
        ],
        "expected_state": {"0": 0.5, "1": 0.5},
    },
    {
        "id": "quantum-swap-implementation",
        "title": "Swap Two Qubit States using CNOTs",
        "difficulty": "Intermediate",
        "category": "Circuit Synthesis",
        "xp": 300,
        "description": "Exchange the quantum information of two qubits using a sequence of three alternating CX gates without using the primitive SWAP gate.",
        "hints": [
            "Apply CX(0, 1).",
            "Apply CX(1, 0).",
            "Apply CX(0, 1).",
        ],
        "expected_state": {},
    },
]


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
    for ch in CHALLENGES_CATALOG:
        if ch["id"] == challenge_id:
            return ch
    raise HTTPException(status_code=404, detail="Challenge not found")


@router.post("/evaluate", response_model=ChallengeEvaluationResult)
def evaluate_challenge(
    submission: ChallengeSubmission,
    current_user: Optional[dict] = Depends(get_optional_current_user),
) -> ChallengeEvaluationResult:
    target_challenge = None
    for ch in CHALLENGES_CATALOG:
        if ch["id"] == submission.challenge_id:
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
    
    if submission.challenge_id == "bell-state-creation":
        p00 = probs.get("00", 0.0)
        p11 = probs.get("11", 0.0)
        p01 = probs.get("01", 0.0)
        p10 = probs.get("10", 0.0)
        
        if p00 > 0.40 and p11 > 0.40 and p01 < 0.05 and p10 < 0.05:
            passed = True
            feedback_msgs.append("Excellent! Your circuit generated the maximally entangled Bell state (|00⟩ + |11⟩)/√2.")
        else:
            passed = False
            feedback_msgs.append(f"State mismatch: Expected 50% |00⟩ and 50% |11⟩. Measured |00⟩: {p00:.2f}, |11⟩: {p11:.2f}.")

    elif submission.challenge_id == "ghz-3qubit-state":
        p000 = probs.get("000", 0.0)
        p111 = probs.get("111", 0.0)
        other_sum = sum(v for k, v in probs.items() if k not in ["000", "111"])
        
        if p000 > 0.40 and p111 > 0.40 and other_sum < 0.08:
            passed = True
            feedback_msgs.append("Flawless! 3-qubit GHZ state (|000⟩ + |111⟩)/√2 successfully verified.")
        else:
            passed = False
            feedback_msgs.append(f"GHZ state requires equal amplitudes on |000⟩ and |111⟩. Measured |000⟩: {p000:.2f}, |111⟩: {p111:.2f}.")

    elif submission.challenge_id == "superposition-phase-flip":
        p0 = probs.get("0", 0.0)
        p1 = probs.get("1", 0.0)
        # Check Dirac notation for minus sign or X+H sequence
        has_x = any(op.gate == "x" for op in submission.circuit.operations)
        has_h = any(op.gate == "h" for op in submission.circuit.operations)
        
        if p0 > 0.40 and p1 > 0.40 and (has_x and has_h or "-" in (sim_result.dirac or "")):
            passed = True
            feedback_msgs.append("Great job! The |−⟩ state with relative phase π was created successfully.")
        else:
            passed = False
            feedback_msgs.append("Make sure to apply X before H so that |0⟩ becomes |1⟩ and transforms into |−⟩.")

    elif submission.challenge_id == "quantum-swap-implementation":
        # Check that 3 CX gates exist and no SWAP gate
        has_swap_gate = any(op.gate == "swap" for op in submission.circuit.operations)
        cx_count = sum(1 for op in submission.circuit.operations if op.gate == "cx")
        if not has_swap_gate and cx_count >= 3:
            passed = True
            feedback_msgs.append("Brilliant! You synthesized the SWAP gate using 3 alternating CX gates.")
        else:
            passed = False
            feedback_msgs.append("Remember to use 3 alternating CX gates: CX(0,1), CX(1,0), CX(0,1) without primitive SWAP.")

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
                        submission.challenge_id,
                        user_id,
                        sim_result.model_dump_json(),
                        score,
                        "; ".join(feedback_msgs),
                    ),
                )
        except Exception:
            pass

    return ChallengeEvaluationResult(
        challenge_id=submission.challenge_id,
        passed=passed,
        score=score,
        xp_earned=xp,
        feedback=" ".join(feedback_msgs),
        measured_probabilities=probs,
        expected_probabilities=expected,
    )
