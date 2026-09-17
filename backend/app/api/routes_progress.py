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
def get_my_progress(current_user: Optional[dict] = Depends(get_optional_current_user)) -> dict[str, Any]:
    if current_user and current_user.get("sub"):
        return repository.get_user_progress(current_user["sub"])
    demo_user = repository.get_user_by_email("student@sambhav.edu")
    if demo_user:
        return repository.get_user_progress(demo_user["id"])
    return {
        "userId": "guest-student",
        "xp": 0,
        "level": 1,
        "streakDays": 0,
        "completedLessons": 0,
        "simulationsRun": 0,
        "challengesSolved": 0,
        "averageScore": 0.0,
        "records": [],
    }


@router.post("/record")
def record_lesson_progress(
    payload: LessonProgressPayload,
    current_user: Optional[dict] = Depends(get_optional_current_user),
) -> dict[str, str]:
    if current_user and current_user.get("sub"):
        user_id = current_user["sub"]
    else:
        demo_user = repository.get_user_by_email("student@sambhav.edu")
        user_id = demo_user["id"] if demo_user else "guest-student"

    repository.record_progress(
        user_id=user_id,
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
