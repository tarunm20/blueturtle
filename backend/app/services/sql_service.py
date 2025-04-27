# app/services/sql_service.py
import psycopg
import time
from app.utils.colors import Colors as C

def get_db_schema(db_url: str) -> str:
    """Get the schema for a database"""
    print(f"{C.SQL}[SQL]{C.RESET} Getting database schema from {db_url.split('@')[0]}...")
    start_time = time.time()
    
    try:
        with psycopg.connect(db_url) as conn:
            with conn.cursor() as cur:
                print(f"{C.SQL}[SQL]{C.RESET} Executing schema query...")
                cur.execute("""
                    SELECT table_name, column_name, data_type
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                    ORDER BY table_name, ordinal_position;
                """)
                rows = cur.fetchall()
                print(f"{C.SQL}[SQL]{C.RESET} Retrieved information about {len(rows)} columns")

        # Process schema
        schema = {}
        for table, column, dtype in rows:
            schema.setdefault(table, []).append(f"{column} ({dtype})")

        # Format schema as string
        schema_str = ""
        for table, columns in schema.items():
            schema_str += f"Table: {table}\n  Columns: {', '.join(columns)}\n"
        
        process_time = time.time() - start_time
        print(f"{C.SQL}[SQL]{C.RESET} Schema processed in {process_time:.2f}s, found {len(schema.keys())} tables")
        
        return schema_str
        
    except Exception as e:
        print(f"{C.ERROR}[ERROR]{C.RESET} Database schema error: {str(e)}")
        raise RuntimeError(f"Database schema error: {str(e)}")

def create_prompt(user_prompt: str, db_schema: str) -> str:
    """Create a prompt for the LLM"""
    print(f"{C.SQL}[PROMPT]{C.RESET} Building prompt for query: '{user_prompt[:50]}...'")
    
    prompt = f"""
    You are an expert SQL assistant.
    Given the following database schema and a user request, write a correct SQL SELECT query that fulfills the request.
    Your query must only use standard SQL features and functions.

    Schema:
    {db_schema}

    User request:
    {user_prompt}
    
    Output only the SQL. Do not include explanations, comments, or additional text.
    The output must be a valid SQL query that can be executed directly on the database.
    Format the response as a single-line SQL query with no unnecessary whitespace or line breaks.
    Return a single JSON object in the following format:
    {{
    "query": "your_query_here"
    }}
    """
    
    print(f"{C.SQL}[PROMPT]{C.RESET} Prompt created (length: {len(prompt)} chars)")
    return prompt

def execute_sql(sql: str, db_url: str):
    """Execute SQL and return results"""
    print(f"{C.SQL}[SQL]{C.RESET} Executing query: {sql}")
    start_time = time.time()

    try:
        with psycopg.connect(db_url) as conn:
            with conn.cursor() as cur:
                print(f"{C.SQL}[SQL]{C.RESET} Connected to database, executing query...")
                cur.execute(sql)
                
                columns = [desc.name for desc in cur.description]
                rows = cur.fetchall()
                
                process_time = time.time() - start_time
                print(f"{C.SQL}[SQL]{C.RESET} Query executed in {process_time:.2f}s, returned {len(rows)} rows")
                
                return {"columns": columns, "rows": rows}
                
    except Exception as e:
        print(f"{C.ERROR}[ERROR]{C.RESET} SQL execution failed: {str(e)}")
        raise RuntimeError(f"SQL error: {str(e)}")

def test_connection(db_url: str) -> dict:
    """Test if a database connection is valid"""
    print(f"{C.SQL}[SQL]{C.RESET} Testing connection to database...")
    start_time = time.time()
    
    try:
        with psycopg.connect(db_url) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                process_time = time.time() - start_time
                print(f"{C.SQL}[SQL]{C.RESET} Connection test successful ({process_time:.2f}s)")
                return {"success": True, "message": "Connection successful"}
    except Exception as e:
        print(f"{C.ERROR}[ERROR]{C.RESET} Connection test failed: {str(e)}")
        return {"success": False, "message": str(e)}