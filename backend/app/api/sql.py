# app/api/sql.py
from fastapi import APIRouter, HTTPException, Request
import time
import uuid
from app.models.sql import GenerateSQLRequest, GenerateSQLResponse, ExecuteSQLRequest, ExecuteSQLResponse
from app.services import sql_service, llm_service

router = APIRouter(tags=["sql"])

@router.post("/generate_sql", response_model=GenerateSQLResponse)
async def generate_sql(request: Request, req: GenerateSQLRequest):
    """Generate SQL from natural language"""
    request_id = str(uuid.uuid4())[:8]
    print(f"[API:{request_id}] Generate SQL request received: '{req.user_prompt[:50]}...'")
    start_time = time.time()
    
    try:
        # Get database schema
        print(f"[API:{request_id}] Getting database schema")
        db_schema = sql_service.get_db_schema(req.db_url)
        
        # Create prompt
        print(f"[API:{request_id}] Creating prompt")
        prompt = sql_service.create_prompt(req.user_prompt, db_schema)
        
        # Generate SQL
        provider = req.llm_config.get("provider", "ollama")
        model = req.llm_config.get("model", "llama3.2")
        url = req.llm_config.get("url", "http://localhost:11434/api/generate")
        
        print(f"[API:{request_id}] Calling LLM service")
        sql = await llm_service.generate_sql(
            provider=provider,
            model=model,
            url=url,
            prompt=prompt
        )
        
        process_time = time.time() - start_time
        print(f"[API:{request_id}] SQL generation completed in {process_time:.2f}s")
        
        return GenerateSQLResponse(sql=sql)
    except Exception as e:
        process_time = time.time() - start_time
        print(f"[ERROR:{request_id}] SQL generation failed after {process_time:.2f}s: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/execute_sql", response_model=ExecuteSQLResponse)
async def execute_sql(request: Request, req: ExecuteSQLRequest):
    """Execute SQL and return results"""
    request_id = str(uuid.uuid4())[:8]
    print(f"[API:{request_id}] Execute SQL request received")
    start_time = time.time()
    
    try:
        print(f"[API:{request_id}] Executing SQL: {req.sql}")
        
        result = sql_service.execute_sql(req.sql, req.db_url)
        
        process_time = time.time() - start_time
        print(f"[API:{request_id}] SQL execution completed in {process_time:.2f}s")
        
        return ExecuteSQLResponse(**result)
    except Exception as e:
        process_time = time.time() - start_time
        print(f"[ERROR:{request_id}] SQL execution failed after {process_time:.2f}s: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/test_db_connection/{connection_string:path}")
async def test_db_connection(request: Request, connection_string: str):
    """Test if a database connection is valid"""
    request_id = str(uuid.uuid4())[:8]
    print(f"[API:{request_id}] Test database connection request")
    
    try:
        result = sql_service.test_connection(connection_string)
        print(f"[API:{request_id}] Connection test result: {result['success']}")
        return result
    except Exception as e:
        print(f"[ERROR:{request_id}] Connection test error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/get_db_schema/{connection_string:path}")
async def get_db_schema_endpoint(request: Request, connection_string: str):
    """Get the database schema in a structured format"""
    request_id = str(uuid.uuid4())[:8]
    print(f"[API:{request_id}] Get database schema request")
    start_time = time.time()
    
    try:
        # Get the raw schema text
        schema_text = sql_service.get_db_schema(connection_string)
        
        # Parse the schema text into a structured format
        schema_dict = {}
        current_table = None
        
        for line in schema_text.strip().split('\n'):
            if line.startswith("Table:"):
                current_table = line.replace("Table:", "").strip()
                schema_dict[current_table] = []
            elif line.strip().startswith("Columns:"):
                columns_text = line.replace("Columns:", "").strip()
                columns = [col.strip() for col in columns_text.split(',')]
                schema_dict[current_table] = columns
        
        process_time = time.time() - start_time
        print(f"[API:{request_id}] Schema processed in {process_time:.2f}s, found {len(schema_dict)} tables")
        
        return {"success": True, "schema": schema_dict}
    except Exception as e:
        process_time = time.time() - start_time
        print(f"[ERROR:{request_id}] Schema processing failed after {process_time:.2f}s: {str(e)}")
        return {"success": False, "message": str(e)}