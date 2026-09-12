from typing import Any
from fastapi import APIRouter, Depends

from app.auth.security import get_optional_current_user
from app.db import repository


router = APIRouter()


@router.get("/dashboard")
def instructor_dashboard(current_user: Any = Depends(get_optional_current_user)) -> dict[str, Any]:
    return repository.get_instructor_dashboard_data()


@router.get("/students")
def list_students(current_user: Any = Depends(get_optional_current_user)) -> list[dict[str, Any]]:
    return repository.list_users_by_role("student")
