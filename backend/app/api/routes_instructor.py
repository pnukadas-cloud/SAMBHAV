from typing import Any
from fastapi import APIRouter, Depends, HTTPException

from app.auth.security import require_role
from app.db import repository


router = APIRouter()


@router.get("/dashboard")
def instructor_dashboard(current_user: dict = Depends(require_role("instructor"))) -> dict[str, Any]:
    """Protected endpoint requiring real instructor authorization."""
    return repository.get_instructor_dashboard_data()


@router.get("/students")
def list_students(current_user: dict = Depends(require_role("instructor"))) -> list[dict[str, Any]]:
    """List all students for the instructor classroom."""
    return repository.list_users_by_role("student")


@router.get("/students/{student_id}")
def get_student_detail(student_id: str, current_user: dict = Depends(require_role("instructor"))) -> dict[str, Any]:
    """Get detailed student performance and progress history."""
    student = repository.get_user_by_id(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    progress = repository.get_user_progress(student_id)
    circuits = repository.get_user_circuits(student_id)
    return {
        "student": student,
        "progress": progress,
        "circuits": circuits,
    }
