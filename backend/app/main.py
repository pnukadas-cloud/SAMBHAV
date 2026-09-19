import os
import re
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import api_router
from app.db.seeds import seed_database

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Automatically initialize schema and seed demo accounts/curriculum on startup
    try:
        seed_database()
    except Exception as e:
        print(f"Database startup warning: {e}")
    yield


app = FastAPI(
    title="SAMBHAV Quantum Learning API",
    description="AI-powered interactive quantum algorithm learning platform.",
    version="0.1.0",
    lifespan=lifespan,
)

# Production & Development CORS Configuration
env_cors = os.getenv("CORS_ORIGINS", "")
frontend_origin = os.getenv("FRONTEND_ORIGIN", "")

allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

if env_cors:
    for origin in env_cors.split(","):
        cleaned = origin.strip()
        if cleaned and cleaned not in allowed_origins:
            allowed_origins.append(cleaned)

if frontend_origin and frontend_origin.strip() not in allowed_origins:
    allowed_origins.append(frontend_origin.strip())

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^(https?://(localhost|127\.0\.0\.1)(:\d+)?|https://[a-zA-Z0-9-]+\.(web\.app|firebaseapp\.com))$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "sambhav-api"}


app.include_router(api_router, prefix="/api")
