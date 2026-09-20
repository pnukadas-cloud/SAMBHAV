import importlib
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
    # On Serverless / Linux / Read-Only filesystems, always use /tmp
    is_serverless_or_linux = (
        os.getenv("VERCEL") is not None
        or os.getenv("AWS_LAMBDA_FUNCTION_NAME") is not None
        or os.name != "nt"
        or os.path.exists("/tmp")
    )

    url = get_database_url()
    if url.startswith("sqlite:///"):
        path_str = url.replace("sqlite:///", "").strip()
        target = Path(path_str)
        if is_serverless_or_linux:
            return Path(f"/tmp/{target.name}")
        return target
    
    if is_serverless_or_linux:
        tmp_db = Path("/tmp/sambhav.db")
        # Check if existing tmp_db is read-only from previous run
        if tmp_db.exists() and not os.access(str(tmp_db), os.W_OK):
            try:
                os.remove(str(tmp_db))
            except Exception:
                pass

        if not tmp_db.exists():
            for candidate in [
                DEFAULT_SQLITE_PATH,
                Path("sambhav.db"),
                Path("backend/sambhav.db"),
                Path(__file__).resolve().parent.parent.parent / "sambhav.db",
                Path(__file__).resolve().parent.parent.parent.parent / "sambhav.db",
                Path(__file__).resolve().parent.parent.parent.parent / "backend" / "sambhav.db",
            ]:
                if candidate.exists():
                    import shutil
                    try:
                        shutil.copyfile(str(candidate), str(tmp_db))
                        try:
                            os.chmod(str(tmp_db), 0o666)
                        except Exception:
                            pass
                        break
                    except Exception:
                        pass
        else:
            try:
                os.chmod(str(tmp_db), 0o666)
            except Exception:
                pass
        return tmp_db

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
            psycopg2_extras = importlib.import_module("psycopg2.extras")
            raw_cur = self._conn.cursor(cursor_factory=psycopg2_extras.RealDictCursor)
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


FALLBACK_SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'instructor', 'admin')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  created_by TEXT REFERENCES users(id),
  published BOOLEAN NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS modules (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT NOT NULL DEFAULT 'Beginner',
  prerequisites TEXT,
  content_markdown TEXT NOT NULL DEFAULT '',
  estimated_minutes INTEGER NOT NULL DEFAULT 10,
  order_index INTEGER NOT NULL DEFAULT 1,
  learning_objectives_json TEXT,
  structured_sections_json TEXT,
  quantum_config_json TEXT,
  assessment_json TEXT,
  ai_context_json TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  created_by TEXT REFERENCES users(id),
  is_canonical BOOLEAN NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS circuits (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  circuit_ir_json TEXT NOT NULL,
  source_code TEXT,
  framework TEXT NOT NULL DEFAULT 'qiskit',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS simulation_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  circuit_id TEXT REFERENCES circuits(id),
  backend TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  shots INTEGER NOT NULL,
  result_json TEXT,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assessments (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id),
  module_id TEXT REFERENCES modules(id),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('quiz', 'coding_challenge', 'exam')),
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  passing_score REAL NOT NULL DEFAULT 70.0,
  questions_json TEXT,
  created_by TEXT REFERENCES users(id),
  published BOOLEAN NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  assessment_id TEXT NOT NULL REFERENCES assessments(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  answer_json TEXT NOT NULL,
  score REAL,
  feedback TEXT,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  course_id TEXT NOT NULL REFERENCES courses(id),
  lesson_id TEXT REFERENCES lessons(id),
  status TEXT NOT NULL,
  score REAL,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  instructor_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  enrollment_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS class_enrollments (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(class_id, student_id)
);

CREATE TABLE IF NOT EXISTS class_assignments (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('lesson', 'assessment', 'lab', 'challenge')),
  target_id TEXT NOT NULL,
  due_date TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lab_assignments (
  id TEXT PRIMARY KEY,
  instructor_id TEXT NOT NULL REFERENCES users(id),
  class_id TEXT REFERENCES classes(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  learning_objective TEXT,
  qubits INTEGER NOT NULL DEFAULT 2,
  starter_circuit_json TEXT,
  required_gates_json TEXT,
  expected_result TEXT,
  hints_json TEXT,
  difficulty TEXT NOT NULL DEFAULT 'Beginner',
  deadline TIMESTAMP,
  marks INTEGER NOT NULL DEFAULT 100,
  instructions TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lab_submissions (
  id TEXT PRIMARY KEY,
  lab_assignment_id TEXT NOT NULL REFERENCES lab_assignments(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES users(id),
  circuit_json TEXT NOT NULL,
  simulation_result_json TEXT,
  status TEXT NOT NULL CHECK (status IN ('submitted', 'graded')),
  score REAL,
  feedback TEXT,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  context_type TEXT NOT NULL,
  related_entity_id TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES ai_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata_json TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
"""

_is_db_ready = False
_is_initializing = False


def ensure_db_ready() -> None:
    """Ensures database schema and canonical seed data are present."""
    global _is_db_ready, _is_initializing
    if _is_db_ready or _is_initializing:
        return
    _is_initializing = True
    try:
        init_db()
        from app.db.seeds import seed_database
        seed_database()
        _is_db_ready = True
    except Exception as e:
        print(f"ensure_db_ready warning: {e}")
    finally:
        _is_initializing = False


@contextmanager
def get_db_connection() -> Generator[Any, None, None]:
    """
    Yields an active database connection with automatic commit / rollback and dictionary row access.
    Automatically initializes database schema and seeds on cold start.
    """
    if not _is_db_ready and not _is_initializing:
        ensure_db_ready()

    if is_postgres():
        db_url = get_database_url()
        try:
            psycopg2 = importlib.import_module("psycopg2")
            raw_conn = psycopg2.connect(db_url)
            conn = PostgresConnectionWrapper(raw_conn)
        except ImportError:
            try:
                psycopg = importlib.import_module("psycopg")
                psycopg_rows = importlib.import_module("psycopg.rows")
                raw_conn = psycopg.connect(db_url, row_factory=psycopg_rows.dict_row)
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
        if str(db_path).startswith("/tmp") and db_path.exists():
            try:
                os.chmod(str(db_path), 0o666)
            except Exception:
                pass
        conn = sqlite3.connect(str(db_path), check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        try:
            conn.execute("PRAGMA journal_mode = MEMORY;")
        except Exception:
            pass
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
    schema_sql = None
    schema_path = DB_DIR / "schema.sql"
    if schema_path.exists():
        with open(schema_path, "r", encoding="utf-8") as f:
            schema_sql = f.read()
    else:
        for candidate in [
            Path("backend/schema.sql"),
            Path("schema.sql"),
            Path("/app/schema.sql"),
            Path(__file__).resolve().parent.parent.parent.parent / "schema.sql",
            Path(__file__).resolve().parent.parent.parent.parent / "backend" / "schema.sql",
        ]:
            if candidate.exists():
                with open(candidate, "r", encoding="utf-8") as f:
                    schema_sql = f.read()
                break
    
    if not schema_sql:
        schema_sql = FALLBACK_SCHEMA_SQL

    if is_postgres():
        with get_db_connection() as conn:
            cur = conn.cursor()
            for stmt in schema_sql.split(";"):
                cleaned = stmt.strip()
                if cleaned:
                    try:
                        cur.execute(cleaned)
                    except Exception:
                        pass
    else:
        sqlite_sql = _translate_schema_to_sqlite(schema_sql)
        with get_db_connection() as conn:
            cursor = conn.cursor()
            for stmt in sqlite_sql.split(";"):
                cleaned = stmt.strip()
                if cleaned:
                    try:
                        cursor.execute(cleaned)
                    except Exception:
                        pass
            _migrate_sqlite_columns(cursor)
