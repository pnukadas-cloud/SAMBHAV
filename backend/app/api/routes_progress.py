from typing import Any, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.auth.security import get_current_user, get_optional_current_user
from app.db import repository


router = APIRouter()


class LessonProgressPayload(BaseModel):
    course_id: str
    lesson_id: str
    status: str = "completed"
    score: Optional[float] = 100.0
    time_spent: int = 120


@router.get("/me")
def get_my_progress(current_user: dict = Depends(get_current_user)) -> dict[str, Any]:
    return repository.get_user_progress(current_user["sub"])


@router.post("/record")
def record_lesson_progress(
    payload: LessonProgressPayload,
    current_user: dict = Depends(get_current_user),
) -> dict[str, str]:
    repository.record_progress(
        user_id=current_user["sub"],
        course_id=payload.course_id,
        lesson_id=payload.lesson_id,
        status=payload.status,
        score=payload.score,
        time_spent=payload.time_spent,
    )
    return {"status": "recorded"}


@router.get("/demo")
def demo_progress() -> dict[str, Any]:
    demo_user = repository.get_user_by_email("student@sambhav.edu")
    if demo_user:
        return repository.get_user_progress(demo_user["id"])
    return {
        "userId": "demo-student",
        "xp": 1250,
        "level": 3,
        "streakDays": 5,
        "completedLessons": 4,
        "simulationsRun": 12,
        "challengesSolved": 3,
        "averageScore": 92.4,
        "records": [],
    }
