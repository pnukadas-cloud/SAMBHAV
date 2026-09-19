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

# Vercel Serverless Path Resolution Middleware
class VercelPathFixMiddleware:
    """
    Ensures Vercel serverless rewrites resolve correctly to target FastAPI routes.
    When Vercel rewrites to /api/index.py, it passes the original request path in 'x-matched-path'.
    """
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope.get("type") in ("http", "websocket"):
            headers = dict(scope.get("headers", []))
            matched_path = headers.get(b"x-matched-path", b"").decode("utf-8")
            if matched_path:
                scope["path"] = matched_path
            elif scope.get("path", "").startswith("/api/index.py"):
                scope["path"] = scope["path"][len("/api/index.py"):] or "/"
            elif scope.get("path", "").startswith("/api/index"):
                scope["path"] = scope["path"][len("/api/index"):] or "/"
        await self.app(scope, receive, send)

app.add_middleware(VercelPathFixMiddleware)

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
    "https://sambhav-quantum-app.web.app",
    "https://sambhav-quantum.web.app",
    "https://sambhav-quantum-app.firebaseapp.com",
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
    allow_origin_regex=r"^(https?://(localhost|127\.0\.0\.1)(:\d+)?|https://[a-zA-Z0-9-]+\.(web\.app|firebaseapp\.com|vercel\.app))$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root_check() -> dict[str, str]:
    return {"status": "ok", "service": "sambhav-api"}


@app.get("/health")
@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "sambhav-api"}


app.include_router(api_router, prefix="/api")
