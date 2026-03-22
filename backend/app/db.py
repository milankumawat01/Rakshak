import os
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

# Resolve DB path relative to backend/ dir so it works regardless of cwd
_backend_dir = Path(__file__).resolve().parent.parent
_default_db = f"sqlite:///{_backend_dir / 'rakshak.db'}"
DATABASE_URL = os.getenv("DATABASE_URL", _default_db)
if DATABASE_URL == "sqlite:///./rakshak.db":
    DATABASE_URL = _default_db

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a DB session and closes it after."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> bool:
    """Test DB connectivity. Returns True if connected, False otherwise."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
