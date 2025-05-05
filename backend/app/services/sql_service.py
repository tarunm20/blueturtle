# app/services/sql_service.py
import time
from app.utils.colors import Colors as C
from app.utils.db_utils import test_connection, get_db_schema, execute_sql as execute_sql_query

def get_schema(db_config: dict) -> tuple:
    """Get the schema for a database"""
    print(f"{C.SQL}[SQL]{C.RESET} Getting database schema...")
    start_time = time.time()
    
    try:
        schema_str, schema_dict = get_db_schema(db_config)
        
        process_time = time.time() - start_time
        print(f"{C.SQL}[SQL]{C.RESET} Schema processed in {process_time:.2f}s")
        
        return schema_str, schema_dict
        
    except Exception as e:
        print(f"{C.ERROR}[ERROR]{C.RESET} Database schema error: {str(e)}")
        raise RuntimeError(f"Database schema error: {str(e)}")

def execute_sql(sql: str, db_config: dict) -> dict:
    """Execute SQL and return results"""
    print(f"{C.SQL}[SQL]{C.RESET} Executing query: {sql}")
    start_time = time.time()

    try:
        result = execute_sql_query(sql, db_config)
        
        process_time = time.time() - start_time
        print(f"{C.SQL}[SQL]{C.RESET} Query executed in {process_time:.2f}s")
        
        return result
                
    except Exception as e:
        print(f"{C.ERROR}[ERROR]{C.RESET} SQL execution failed: {str(e)}")
        raise RuntimeError(f"SQL error: {str(e)}")

def test_db_connection(db_config: dict) -> dict:
    """Test if a database connection is valid"""
    print(f"{C.SQL}[SQL]{C.RESET} Testing connection to database...")
    start_time = time.time()
    
    try:
        result = test_connection(db_config)
        
        process_time = time.time() - start_time
        print(f"{C.SQL}[SQL]{C.RESET} Connection test completed in {process_time:.2f}s")
        
        return result
    except Exception as e:
        print(f"{C.ERROR}[ERROR]{C.RESET} Connection test failed: {str(e)}")
        return {"success": False, "message": str(e)}