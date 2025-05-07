# app/api/sql.py
from fastapi import APIRouter, HTTPException, Request
import time
import uuid
import json
import re
from app.models.sql import GenerateSQLRequest, GenerateSQLResponse, ExecuteSQLRequest, ExecuteSQLResponse
from app.services import sql_service, llm_service
from app.utils.prompt_builder import build_llm_prompt, build_llm_prompt_with_history

router = APIRouter(tags=["sql"])

@router.post("/generate_sql", response_model=GenerateSQLResponse)
async def generate_sql(request: Request, req: GenerateSQLRequest):
    """Generate SQL from natural language"""
    request_id = str(uuid.uuid4())[:8]
    print(f"[API:{request_id}] Generate SQL request received: '{req.user_prompt[:50]}...'")
    start_time = time.time()
    
    try:
        # Get database schema
        schema_str, _ = sql_service.get_schema(req.db_connection.dict())
        
        # Create prompt with schema and message history
        print(f"[API:{request_id}] Creating prompt with schema and history")
        prompt = build_llm_prompt_with_history(
            req.user_prompt, 
            schema_str,
            req.message_history
        )
        
        # Generate SQL
        provider = req.llm_config.provider
        model = req.llm_config.model or "llama3.2"
        url = req.llm_config.url or "http://localhost:11434/api/generate"
        
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
        
        result = sql_service.execute_sql(req.sql, req.db_connection.dict())
        
        process_time = time.time() - start_time
        print(f"[API:{request_id}] SQL execution completed in {process_time:.2f}s")
        
        return ExecuteSQLResponse(**result)
    except Exception as e:
        process_time = time.time() - start_time
        print(f"[ERROR:{request_id}] SQL execution failed after {process_time:.2f}s: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/test_db_connection")
async def test_db_connection(request: Request, db_config: dict):
    """Test if a database connection is valid"""
    request_id = str(uuid.uuid4())[:8]
    print(f"[API:{request_id}] Test database connection request")
    
    try:
        result = sql_service.test_db_connection(db_config)
        print(f"[API:{request_id}] Connection test result: {result['success']}")
        return result
    except Exception as e:
        print(f"[ERROR:{request_id}] Connection test error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/get_db_schema")
async def get_db_schema_endpoint(request: Request, db_config: dict):
    """Get the database schema in a structured format"""
    request_id = str(uuid.uuid4())[:8]
    print(f"[API:{request_id}] Get database schema request")
    start_time = time.time()
    
    try:
        # Get the schema
        _, schema_dict = sql_service.get_schema(db_config)
        
        process_time = time.time() - start_time
        print(f"[API:{request_id}] Schema processed in {process_time:.2f}s")
        
        return {"success": True, "schema": schema_dict}
    except Exception as e:
        process_time = time.time() - start_time
        print(f"[ERROR:{request_id}] Schema processing failed after {process_time:.2f}s: {str(e)}")
        return {"success": False, "message": str(e)}
    
@router.post("/recommend_visualization")
async def recommend_visualization(request: Request, req: dict):
    """Recommend visualization for query results"""
    request_id = str(uuid.uuid4())[:8]
    print(f"[API:{request_id}] Visualization recommendation request")
    
    try:
        # Extract the data from the request
        user_question = req.get("question", "")
        columns = req.get("columns", [])
        rows = req.get("rows", [])
        llm_config = req.get("llm_config", {})
        
        # Check if we have at least some data to work with
        if not columns or not rows:
            return {"visualization": False, "explanation": "No data available for visualization"}
        
        # Create prompt for LLM using the prompt builder
        from app.utils.prompt_builder import build_visualization_prompt
        prompt = build_visualization_prompt(user_question, columns, rows)
        
        # Send to LLM service
        provider = llm_config.get("provider", "ollama")
        model = llm_config.get("model", "llama3.2")
        url = llm_config.get("url", "http://localhost:11434/api/generate")
        
        print(f"[API:{request_id}] Sending visualization recommendation request to LLM")
        
        # Get LLM response
        llm_response = await llm_service.generate_sql(
            provider=provider,
            model=model,
            url=url,
            prompt=prompt
        )
        
        print(f"[API:{request_id}] Received response from LLM: {llm_response[:100]}...")
        
        # Parse JSON from LLM response
        try:
            # Try to parse as JSON directly
            recommendation = json.loads(llm_response)
            print(f"[API:{request_id}] Successfully parsed JSON directly")
        except json.JSONDecodeError:
            # If not valid JSON, try to extract JSON with regex
            print(f"[API:{request_id}] Failed to parse JSON directly, trying regex")
            match = re.search(r'\{.*\}', llm_response, re.DOTALL)
            if match:
                try:
                    recommendation = json.loads(match.group(0))
                    print(f"[API:{request_id}] Successfully extracted JSON with regex")
                except:
                    print(f"[API:{request_id}] Failed to parse extracted JSON")
                    recommendation = {"visualization": False, "explanation": "Failed to parse LLM response"}
            else:
                print(f"[API:{request_id}] Failed to extract JSON with regex")
                recommendation = {"visualization": False, "explanation": "Failed to extract recommendation"}
        
        # Fallback detection logic - if LLM says no visualization but we have appropriate data
        if not recommendation.get("visualization", False):
            # Check if we have at least one numeric column
            numeric_columns = []
            string_columns = []
            
            # Simple type detection based on first row
            if rows and len(rows) > 0:
                for i, col in enumerate(columns):
                    # Check if we can convert the value to a float
                    try:
                        if rows[0][i] is not None:
                            float(rows[0][i])
                            numeric_columns.append(col)
                    except (ValueError, TypeError):
                        string_columns.append(col)
            
            # If we have a string column and a numeric column, we can create a bar chart
            if string_columns and numeric_columns:
                print(f"[API:{request_id}] LLM said no visualization, but we have appropriate data. Overriding.")
                recommendation = {
                    "visualization": True,
                    "chartType": "bar",
                    "xAxis": string_columns[0],
                    "yAxis": numeric_columns[0],
                    "title": f"{numeric_columns[0]} by {string_columns[0]}",
                    "explanation": "This data is suitable for a bar chart showing the relationship between categories and values."
                }
        
        return recommendation
        
    except Exception as e:
        print(f"[ERROR:{request_id}] Visualization recommendation failed: {str(e)}")
        return {"visualization": False, "error": str(e)}