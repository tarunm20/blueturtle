import psycopg

def get_db_schema(conninfo: str) -> str:
    with psycopg.connect(conninfo) as conn:
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