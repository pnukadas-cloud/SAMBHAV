from fastapi import APIRouter, HTTPException


router = APIRouter()

DEMO_COURSES = [
    {
        "id": "quantum-foundations",
        "title": "Quantum Foundations",
        "difficulty": "Beginner",
        "description": "Qubits, superposition, measurement, and entanglement through interactive circuits.",
        "modules": [
            {
                "id": "m1",
                "title": "From bits to qubits",
                "lessons": [
                    {
                        "id": "bell-state",
                        "title": "Building a Bell State",
                        "estimatedMinutes": 18,
                        "content": "Apply a Hadamard gate to create superposition, then use CNOT to entangle two qubits.",
                    }
                ],
            }
        ],
    }
]


@router.get("")
def list_courses() -> list[dict]:
    return DEMO_COURSES


@router.get("/{course_id}")
def get_course(course_id: str) -> dict:
    for course in DEMO_COURSES:
        if course["id"] == course_id:
            return course
    raise HTTPException(status_code=404, detail="Course not found")

