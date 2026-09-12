import os
import re
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Generator

DATABASE_URL = os.getenv("DATABASE_URL", "")

# Default to local SQLite database in the backend folder
DB_DIR = Path(__file__).resolve().parent.parent.parent
DEFAULT_SQLITE_PATH = DB_DIR / "sambhav.db"


def get_sqlite_path() -> Path:
    if DATABASE_URL.startswith("sqlite:///"):
        path_str = DATABASE_URL.replace("sqlite:///", "")
        return Path(path_str)
    return DEFAULT_SQLITE_PATH


@contextmanager
def get_db_connection() -> Generator[sqlite3.Connection, None, None]:
    """
    Returns a database connection with dictionary-like row access.
    Supports SQLite for zero-setup local dev, and PostgreSQL compatibility architecture.
    """
    db_path = get_sqlite_path()
    conn = sqlite3.connect(str(db_path), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    # Enable foreign keys in SQLite
    conn.execute("PRAGMA foreign_keys = ON;")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def _translate_schema_to_sqlite(sql: str) -> str:
    """Translates PostgreSQL schema types to SQLite equivalents."""
    sql = re.sub(r"\bCREATE\s+TABLE\b", "CREATE TABLE IF NOT EXISTS", sql, flags=re.IGNORECASE)
    sql = re.sub(r"\bUUID\b", "TEXT", sql, flags=re.IGNORECASE)
    sql = re.sub(r"\bTIMESTAMPTZ\b", "TIMESTAMP", sql, flags=re.IGNORECASE)
    sql = re.sub(r"\bJSONB\b", "TEXT", sql, flags=re.IGNORECASE)
    sql = re.sub(r"\bnow\(\)", "CURRENT_TIMESTAMP", sql, flags=re.IGNORECASE)
    sql = re.sub(r"\bNUMERIC\b", "REAL", sql, flags=re.IGNORECASE)
    return sql


def init_db(force: bool = False) -> None:
    """
    Initializes database tables if they do not exist.
    """
    db_path = get_sqlite_path()
    schema_path = DB_DIR / "schema.sql"

    if not schema_path.exists():
        return

    with open(schema_path, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    sqlite_sql = _translate_schema_to_sqlite(schema_sql)

    with get_db_connection() as conn:
        cursor = conn.cursor()
        # Execute each statement
        for stmt in sqlite_sql.split(";"):
            cleaned = stmt.strip()
            if cleaned:
                cursor.execute(cleaned)
