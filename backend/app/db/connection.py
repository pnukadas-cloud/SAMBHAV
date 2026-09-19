import os
import re
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Generator, Optional, Sequence, Union

DB_DIR = Path(__file__).resolve().parent.parent.parent
DEFAULT_SQLITE_PATH = DB_DIR / "sambhav.db"


def is_postgres() -> bool:
    url = os.getenv("DATABASE_URL", "").strip()
    return url.startswith("postgresql://") or url.startswith("postgres://") or url.startswith("postgresql+psycopg2://")


def get_database_url() -> str:
    return os.getenv("DATABASE_URL", "").strip()


def get_sqlite_path() -> Path:
    url = get_database_url()
    if url.startswith("sqlite:///"):
        path_str = url.replace("sqlite:///", "")
        return Path(path_str)
    return DEFAULT_SQLITE_PATH


class PostgresCursorWrapper:
    """
    Wraps a psycopg2/psycopg cursor to provide full compatibility with
    the existing SQLite repository interface:
    - Automatically converts '?' query parameter placeholders to '%s'
    - Wraps rows in dict-like structures supporting row['col'] and dict(row)
    - Exposes rowcount, description, and standard cursor methods.
    """

    def __init__(self, raw_cursor: Any) -> None:
        self._cursor = raw_cursor

    def _convert_query(self, query: str) -> str:
        # Convert SQLite '?' parameter placeholders to PostgreSQL '%s'
        # without altering question marks within string literals
        parts = re.split(r"('(?:''|[^'])*')", query)
        for i in range(0, len(parts), 2):
            parts[i] = parts[i].replace("?", "%s")
        return "".join(parts)

    def execute(self, query: str, params: Optional[Union[Sequence[Any], dict[str, Any]]] = None) -> Any:
        converted_query = self._convert_query(query)
        if params is not None:
            # Handle tuple/list parameters
            if isinstance(params, (tuple, list)):
                return self._cursor.execute(converted_query, tuple(params))
            return self._cursor.execute(converted_query, params)
        return self._cursor.execute(converted_query)

    def executemany(self, query: str, seq_of_params: Sequence[Sequence[Any]]) -> Any:
        converted_query = self._convert_query(query)
        return self._cursor.executemany(converted_query, seq_of_params)

    def fetchone(self) -> Optional[dict[str, Any]]:
        row = self._cursor.fetchone()
        if row is None:
            return None
        return dict(row)

    def fetchall(self) -> list[dict[str, Any]]:
        rows = self._cursor.fetchall()
        return [dict(r) for r in rows]

    @property
    def rowcount(self) -> int:
        return self._cursor.rowcount

    @property
    def description(self) -> Any:
        return self._cursor.description

    def close(self) -> None:
        self._cursor.close()


class PostgresConnectionWrapper:
    """Wraps a psycopg2 connection for seamless context manager use."""

    def __init__(self, raw_conn: Any) -> None:
        self._conn = raw_conn

    def cursor(self) -> PostgresCursorWrapper:
        # Request RealDictCursor if psycopg2 to get dictionary access
        try:
            import psycopg2.extras
            raw_cur = self._conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        except Exception:
            raw_cur = self._conn.cursor()
        return PostgresCursorWrapper(raw_cur)

    def commit(self) -> None:
        self._conn.commit()

    def rollback(self) -> None:
        self._conn.rollback()

    def close(self) -> None:
        self._conn.close()

    def execute(self, query: str, params: Optional[Sequence[Any]] = None) -> Any:
        cur = self.cursor()
        try:
            return cur.execute(query, params)
        finally:
            cur.close()


@contextmanager
def get_db_connection() -> Generator[Any, None, None]:
    """
    Returns an active database connection with dictionary-like row access.
    Supports:
    1. Local SQLite (for local development, fast startup & automated tests)
    2. Google Cloud SQL PostgreSQL (for production Cloud Run deployments)
    """
    if is_postgres():
        db_url = get_database_url()
        try:
            import psycopg2
            raw_conn = psycopg2.connect(db_url)
            conn = PostgresConnectionWrapper(raw_conn)
        except ImportError:
            try:
                import psycopg
                raw_conn = psycopg.connect(db_url, row_factory=psycopg.rows.dict_row)
                conn = PostgresConnectionWrapper(raw_conn)
            except ImportError:
                raise RuntimeError(
                    "PostgreSQL DATABASE_URL provided but neither 'psycopg2' nor 'psycopg' is installed. "
                    "Please install psycopg2-binary or psycopg."
                )
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
    else:
        # SQLite Engine
        db_path = get_sqlite_path()
        conn = sqlite3.connect(str(db_path), check_same_thread=False)
        conn.row_factory = sqlite3.Row
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
    sql = re.sub(r"\bCREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\b", "CREATE TABLE IF NOT EXISTS", sql, flags=re.IGNORECASE)
    sql = re.sub(r"\bUUID\b", "TEXT", sql, flags=re.IGNORECASE)
    sql = re.sub(r"\bTIMESTAMPTZ\b", "TIMESTAMP", sql, flags=re.IGNORECASE)
    sql = re.sub(r"\bJSONB\b", "TEXT", sql, flags=re.IGNORECASE)
    sql = re.sub(r"\bnow\(\)", "CURRENT_TIMESTAMP", sql, flags=re.IGNORECASE)
    sql = re.sub(r"\bNUMERIC\b", "REAL", sql, flags=re.IGNORECASE)
    return sql


def _migrate_sqlite_columns(cursor: Any) -> None:
    """Safely adds missing columns to existing SQLite tables if not already present."""
    tables_columns = {
        "lessons": [
            ("description", "TEXT"),
            ("difficulty", "TEXT DEFAULT 'Beginner'"),
            ("prerequisites", "TEXT"),
            ("learning_objectives_json", "TEXT"),
            ("structured_sections_json", "TEXT"),
            ("quantum_config_json", "TEXT"),
            ("assessment_json", "TEXT"),
            ("ai_context_json", "TEXT"),
            ("status", "TEXT DEFAULT 'published'"),
            ("created_by", "TEXT"),
            ("is_canonical", "INTEGER DEFAULT 0"),
        ],
        "assessments": [
            ("module_id", "TEXT"),
            ("description", "TEXT"),
            ("duration_minutes", "INTEGER DEFAULT 30"),
            ("passing_score", "REAL DEFAULT 70.0"),
            ("questions_json", "TEXT"),
            ("created_by", "TEXT"),
            ("published", "INTEGER DEFAULT 1"),
        ],
    }

    for table, columns in tables_columns.items():
        try:
            cursor.execute(f"PRAGMA table_info({table});")
            existing = {row["name"] for row in cursor.fetchall()}
            for col_name, col_type in columns:
                if col_name not in existing:
                    cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_type};")
        except Exception:
            pass


def init_db(force: bool = False) -> None:
    """
    Initializes database schema if tables do not exist.
    Executes native PostgreSQL schema on Cloud SQL, or translated schema on SQLite.
    """
    schema_path = DB_DIR / "schema.sql"
    if not schema_path.exists():
        # Check current working directory or /app
        alt_schema = Path("/app/schema.sql")
        if alt_schema.exists():
            schema_path = alt_schema
        else:
            return

    with open(schema_path, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    if is_postgres():
        with get_db_connection() as conn:
            cur = conn.cursor()
            for stmt in schema_sql.split(";"):
                cleaned = stmt.strip()
                if cleaned:
                    try:
                        cur.execute(cleaned)
                    except Exception as e:
                        # Continue if table already exists or constraint exists
                        pass
    else:
        sqlite_sql = _translate_schema_to_sqlite(schema_sql)
        with get_db_connection() as conn:
            cursor = conn.cursor()
            for stmt in sqlite_sql.split(";"):
                cleaned = stmt.strip()
                if cleaned:
                    cursor.execute(cleaned)
            _migrate_sqlite_columns(cursor)
