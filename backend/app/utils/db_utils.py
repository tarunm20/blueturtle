# app/utils/db_utils.py
from sqlalchemy import create_engine, inspect, MetaData, text
from sqlalchemy.exc import SQLAlchemyError
import logging
from app.utils.colors import Colors as C

logger = logging.getLogger(__name__)

def build_connection_string(db_config: dict) -> str:
    """Build a SQLAlchemy connection string from database configuration"""
    db_type = db_config.get('db_type', '')
    
    if db_type == 'sqlite':
        db_name = db_config.get('db_name', '')
        if not db_name:
            raise ValueError("Database file path is required for SQLite")
        # For SQLite, just use the file path
        return f"sqlite:///{db_name}"
    
    # For other database types
    db_host = db_config.get('db_host', '')
    db_port = db_config.get('db_port', '')
    db_name = db_config.get('db_name', '')
    db_user = db_config.get('db_user', '')
    db_password = db_config.get('db_password', '')
    
    # Validate required fields
    if not db_host:
        raise ValueError(f"Host is required for {db_type} connection")
    if not db_name:
        raise ValueError(f"Database name is required for {db_type} connection")
    
    # Build connection string based on database type
    if db_type == 'postgres':
        port_part = f":{db_port}" if db_port else ""
        auth_part = f"{db_user}:{db_password}@" if db_user else ""
        return f"postgresql://{auth_part}{db_host}{port_part}/{db_name}"
    
    elif db_type == 'mysql':
        port_part = f":{db_port}" if db_port else ""
        auth_part = f"{db_user}:{db_password}@" if db_user else ""
        return f"mysql+pymysql://{auth_part}{db_host}{port_part}/{db_name}"
    
    elif db_type == 'mssql':
        port_part = f":{db_port}" if db_port else ""
        auth_part = f"{db_user}:{db_password}@" if db_user else ""
        return f"mssql+pyodbc://{auth_part}{db_host}{port_part}/{db_name}?driver=ODBC+Driver+17+for+SQL+Server"
    
    else:
        raise ValueError(f"Unsupported database type: {db_type}")

def test_connection(db_config: dict) -> dict:
    """Test database connection and return result"""
    print(f"{C.SQL}[SQL]{C.RESET} Testing connection to database...")
    
    try:
        # Build connection string
        conn_string = build_connection_string(db_config)
        print(f"{C.SQL}[SQL]{C.RESET} Connection string created (redacted for security)")
        
        # Create a SQLAlchemy engine and test connection
        engine = create_engine(conn_string)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            print(f"{C.SQL}[SQL]{C.RESET} Connection test successful")
            return {"success": True, "message": "Connection successful"}
    
    except ValueError as e:
        print(f"{C.ERROR}[ERROR]{C.RESET} Connection string error: {str(e)}")
        return {"success": False, "message": str(e)}
    
    except SQLAlchemyError as e:
        print(f"{C.ERROR}[ERROR]{C.RESET} Database connection error: {str(e)}")
        return {"success": False, "message": f"Database error: {str(e)}"}
    
    except Exception as e:
        print(f"{C.ERROR}[ERROR]{C.RESET} Unexpected error: {str(e)}")
        return {"success": False, "message": f"Error: {str(e)}"}

def get_db_schema(db_config: dict) -> str:
    """Get database schema as a string using SQLAlchemy"""
    print(f"{C.SQL}[SQL]{C.RESET} Getting database schema...")
    
    try:
        # Build connection string and create engine
        conn_string = build_connection_string(db_config)
        engine = create_engine(conn_string)
        inspector = inspect(engine)
        
        # Get all table names
        table_names = inspector.get_table_names(schema='public')
        print(f"{C.SQL}[SQL]{C.RESET} Found {len(table_names)} tables")
        
        # Build schema string
        schema_str = ""
        schema_dict = {}
        
        for table_name in table_names:
            columns = []
            # Get columns for each table
            for column in inspector.get_columns(table_name):
                col_name = column['name']
                col_type = str(column['type'])
                columns.append(f"{col_name} ({col_type})")
            
            schema_dict[table_name] = columns
            schema_str += f"Table: {table_name}\n  Columns: {', '.join(columns)}\n"
        
        return schema_str, schema_dict
    
    except Exception as e:
        print(f"{C.ERROR}[ERROR]{C.RESET} Schema retrieval error: {str(e)}")
        raise ValueError(f"Failed to retrieve schema: {str(e)}")

def execute_sql(sql: str, db_config: dict):
    """Execute SQL query and return results"""
    print(f"{C.SQL}[SQL]{C.RESET} Executing query: {sql}")
    
    try:
        # Build connection string and create engine
        conn_string = build_connection_string(db_config)
        engine = create_engine(conn_string)
        
        # Execute query
        with engine.connect() as conn:
            result = conn.execute(text(sql))
            columns = result.keys()
            rows = result.fetchall()
            
            print(f"{C.SQL}[SQL]{C.RESET} Query executed, returned {len(rows)} rows")
            return {"columns": columns, "rows": [list(row) for row in rows]}
    
    except Exception as e:
        print(f"{C.ERROR}[ERROR]{C.RESET} SQL execution error: {str(e)}")
        raise ValueError(f"SQL execution failed: {str(e)}")