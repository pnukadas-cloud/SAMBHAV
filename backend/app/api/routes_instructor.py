from fastapi import APIRouter


router = APIRouter()


@router.get("/dashboard")
def instructor_dashboard() -> dict:
    return {
        "classroom": "Quantum Foundations A",
        "activeStudents": 28,
        "averageProgress": 54,
        "commonMistakes": [
            "Confusing superposition with randomness",
            "Missing measurement operations",
            "Using CNOT without identifying control and target",
        ],
        "recentActivity": [
            {"student": "Aarav", "event": "Completed Bell State lesson"},
            {"student": "Meera", "event": "Ran Grover mini-circuit"},
            {"student": "Ishaan", "event": "Submitted superposition quiz"},
        ],
    }

