import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

# Load .env from project root (one level up from backend/)
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from app.db import Base, engine, check_db_connection

# Import all models so Base.metadata knows about them
from app.models.user import User  # noqa: F401
from app.models.submission import Submission  # noqa: F401
from app.models.payment import PaymentHistory  # noqa: F401
from app.models.extraction import *  # noqa: F401,F403
from app.models.assessment import *  # noqa: F401,F403
from app.models.vault import *  # noqa: F401,F403

# Create all tables (safe no-op if they already exist)
Base.metadata.create_all(bind=engine)

from app.api.auth import router as auth_router
from app.api.submissions import router as submissions_router
from app.api.vault import router as vault_router
from app.api.payment import router as payment_router

app = FastAPI(
    title="BhomiRakshak API",
    description="Land verification platform for Jharkhand",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://64.227.182.255",
        "http://152.67.14.19",
        "https://bhumirakshak.com",
        "http://bhumirakshak.com",
        "https://www.bhumirakshak.com",
        "http://www.bhumirakshak.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(auth_router)
app.include_router(submissions_router)
app.include_router(vault_router)
app.include_router(payment_router)

# Mount uploads directory as static files
upload_dir = os.getenv("UPLOAD_DIR", "./uploads")
os.makedirs(upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")


@app.get("/health")
def health_check():
    db_connected = check_db_connection()
    return {
        "status": "ok" if db_connected else "error",
        "db": "connected" if db_connected else "disconnected",
    }


# Serve frontend static files (production build)
frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    from fastapi.responses import FileResponse

    # Serve static assets (js, css, images)
    app.mount("/assets", StaticFiles(directory=frontend_dist / "assets"), name="frontend-assets")

    # Catch-all: serve index.html for SPA routing
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = frontend_dist / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")
