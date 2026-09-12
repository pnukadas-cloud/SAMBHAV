from fastapi import APIRouter


router = APIRouter()


@router.get("/demo")
def demo_progress() -> dict:
    return {
        "student": "Demo Student",
        "courseProgress": 42,
        "lessonsCompleted": 3,
        "simulationsRun": 7,
        "assessmentAverage": 86,
    }

