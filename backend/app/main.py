import os
import re
import urllib.parse
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, Request
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
    Extracts the original request path from '__path__' query parameter (in vercel.json)
    or from Vercel headers ('x-matched-path', 'x-forwarded-uri', etc.).
    """
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope.get("type") in ("http", "websocket"):
            query_bytes = scope.get("query_string", b"")
            query_str = query_bytes.decode("utf-8", errors="ignore") if query_bytes else ""
            
            # 1. Check if __path__ was captured by vercel rewrite rule
            if "__path__=" in query_str:
                parsed_qs = urllib.parse.parse_qs(query_str, keep_blank_values=True)
                if "__path__" in parsed_qs and parsed_qs["__path__"]:
                    raw_target = parsed_qs.pop("__path__")[0]
                    # Normalize leading slash and strip duplicate slashes
                    target_path = "/" + raw_target.lstrip("/") if raw_target else "/"
                    scope["path"] = target_path
                    
                    # Reconstruct clean query string for endpoint consumption
                    clean_pairs = []
                    for k, v_list in parsed_qs.items():
                        for v in v_list:
                            clean_pairs.append(f"{urllib.parse.quote(k)}={urllib.parse.quote(v)}")
                    scope["query_string"] = "&".join(clean_pairs).encode("utf-8")
            else:
                # 2. Check headers
                headers = dict(scope.get("headers", []))
                matched_path = headers.get(b"x-matched-path", b"").decode("utf-8")
                forwarded_uri = headers.get(b"x-forwarded-uri", b"").decode("utf-8")
                
                candidate = ""
                if forwarded_uri and not forwarded_uri.startswith("/api/index"):
                    candidate = forwarded_uri.split("?")[0]
                elif matched_path and not matched_path.startswith("/api/index"):
                    candidate = matched_path.split("?")[0]
                
                if candidate:
                    scope["path"] = "/" + candidate.lstrip("/")
                else:
                    curr_path = scope.get("path", "")
                    if curr_path.startswith("/api/index.py"):
                        scope["path"] = curr_path[len("/api/index.py"):] or "/"
                    elif curr_path.startswith("/api/index"):
                        scope["path"] = curr_path[len("/api/index"):] or "/"

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
