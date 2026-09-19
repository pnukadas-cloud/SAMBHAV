"""
Standalone Safe Database Migration Runner for SAMBHAV.
Executes non-destructive forward schema migrations and ensures tables/indexes exist.
Can be executed in CI/CD, deployment pipelines, or directly in development.
"""
import sys
import logging
from app.db.connection import init_db, is_postgres, get_database_url
from app.db.seeds import seed_database

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("sambhav.migrations")


def run_migrations():
    logger.info("Starting SAMBHAV safe database migrations...")
    engine_type = "PostgreSQL (Cloud SQL)" if is_postgres() else "SQLite (Local/Testing)"
    logger.info(f"Target Database Engine: {engine_type}")

    try:
        init_db()
        logger.info("Schema verification & non-destructive table initialization complete.")
        
        # Seed initial canonical courses/challenges if empty
        seed_database()
        logger.info("System canonical seed data verified.")
        
        logger.info("All database migrations applied successfully!")
        return 0
    except Exception as e:
        logger.error(f"Migration failed: {e}", exc_info=True)
        return 1


if __name__ == "__main__":
    sys.exit(run_migrations())
