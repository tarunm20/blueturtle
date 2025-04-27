# app/db/schema.py
import psycopg
import logging

logger = logging.getLogger(__name__)

def get_db_schema(db_url: str) -> str:
    """Get the schema for a database"""
    try:
        with psycopg.connect(db_url) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT table_name, column_name, data_type
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                    ORDER BY table_name, ordinal_position;
                """)
                rows = cur.fetchall()

        schema = {}
        for table, column, dtype in rows:
            schema.setdefault(table, []).append(f"{column} ({dtype})")

        schema_str = ""
        for table, columns in schema.items():
            schema_str += f"Table: {table}\n  Columns: {', '.join(columns)}\n"
        return schema_str
        
    except Exception as e:
        logger.error(f"Error getting database schema: {e}")
        raise