# app/db/connection.py
import psycopg
from psycopg.rows import dict_row
import logging
from contextlib import contextmanager
from app.config import settings

logger = logging.getLogger(__name__)

@contextmanager
def get_connection():
    """Get a database connection"""
    conn = None
    try:
        conn = psycopg.connect(settings.DATABASE_URL)
        yield conn
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        raise
    finally:
        if conn:
            conn.close()

@contextmanager
def get_dict_cursor():
    """Get a cursor that returns dictionaries"""
    with get_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            yield cur

def init_db():
    """Initialize the database schema"""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS conversations (
                    id SERIAL PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    title TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            cur.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    id SERIAL PRIMARY KEY,
                    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    sql TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)