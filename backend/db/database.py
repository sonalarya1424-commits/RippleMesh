import sqlite3
from contextlib import contextmanager
from backend.config import DATABASE_PATH

def get_connection() -> sqlite3.Connection:
    """Returns a connection to the SQLite database with row factory and foreign keys enabled."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

@contextmanager
def get_db():
    """Context manager for managing SQLite transactions cleanly."""
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
