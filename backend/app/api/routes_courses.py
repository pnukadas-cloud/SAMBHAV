from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.auth.security import get_current_user, require_role
from app.db import repository


router = APIRouter()


class CreateCourseRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    description: str = Field(..., min_length=5)
    difficulty: str = Field(default="Beginner", pattern="^(Beginner|Intermediate|Advanced)$")
    published: bool = True


class CreateModuleRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    order_index: int = 1


class CreateLessonRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    content_markdown: str = Field(default="")
    estimated_minutes: int = Field(default=15, ge=1, le=180)
    order_index: int = 1


@router.get("")
def list_courses() -> list[dict[str, Any]]:
    courses = repository.list_courses()
    if not courses:
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


@router.post("", status_code=status.HTTP_201_CREATED)
def create_course(
    payload: CreateCourseRequest,
    current_user: dict = Depends(require_role("instructor")),
) -> dict[str, Any]:
    """Protected instructor endpoint to author and publish a new course."""
    return repository.create_course(
        title=payload.title,
        description=payload.description,
        difficulty=payload.difficulty,
        created_by=current_user["sub"],
        published=payload.published,
    )


@router.get("/{course_id}")
def get_course(course_id: str) -> dict[str, Any]:
    course = repository.get_course_by_id(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.post("/{course_id}/modules", status_code=status.HTTP_201_CREATED)
def create_module(
    course_id: str,
    payload: CreateModuleRequest,
    current_user: dict = Depends(require_role("instructor")),
) -> dict[str, Any]:
    """Protected instructor endpoint to add a module to a course."""
    course = repository.get_course_by_id(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return repository.create_module(
        course_id=course_id,
        title=payload.title,
        order_index=payload.order_index,
    )


@router.get("/lessons/{lesson_id}")
def get_lesson(lesson_id: str) -> dict[str, Any]:
    lesson = repository.get_lesson_by_id(lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson


@router.post("/modules/{module_id}/lessons", status_code=status.HTTP_201_CREATED)
def create_lesson(
    module_id: str,
    payload: CreateLessonRequest,
    current_user: dict = Depends(require_role("instructor")),
) -> dict[str, Any]:
    """Protected instructor endpoint to add a lesson to a module."""
    return repository.create_lesson(
        module_id=module_id,
        title=payload.title,
        content_markdown=payload.content_markdown,
        estimated_minutes=payload.estimated_minutes,
        order_index=payload.order_index,
    )
