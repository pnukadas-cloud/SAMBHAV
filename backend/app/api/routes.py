from fastapi import APIRouter

from app.api import routes_ai, routes_circuits, routes_courses, routes_instructor, routes_progress, routes_simulations


api_router = APIRouter()
api_router.include_router(routes_courses.router, prefix="/courses", tags=["courses"])
api_router.include_router(routes_circuits.router, prefix="/circuits", tags=["circuits"])
api_router.include_router(routes_simulations.router, prefix="/simulations", tags=["simulations"])
api_router.include_router(routes_ai.router, prefix="/ai", tags=["ai-tutor"])
api_router.include_router(routes_progress.router, prefix="/progress", tags=["progress"])
api_router.include_router(routes_instructor.router, prefix="/instructor", tags=["instructor"])

