from typing import Any
from fastapi import APIRouter, HTTPException

from app.db import repository


router = APIRouter()


@router.get("")
def list_courses() -> list[dict[str, Any]]:
    courses = repository.list_courses()
    if not courses:
        # Return fallback catalog if empty
        return [
            {
                "id": "quantum-foundations",
                "title": "Quantum Foundations",
                "description": "From Classical Bits to Quantum Superposition and the Bloch Sphere",
                "difficulty": "Beginner",
                "modules": [],
            }
        ]
    return courses


@router.get("/{course_id}")
def get_course(course_id: str) -> dict[str, Any]:
    course = repository.get_course_by_id(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.get("/lessons/{lesson_id}")
def get_lesson(lesson_id: str) -> dict[str, Any]:
    lesson = repository.get_lesson_by_id(lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson
