# app/api/sql.py - Updated to handle connection URI
from fastapi import APIRouter, HTTPException, Request
import time
import uuid
import json
import re
from app.models.sql import GenerateSQLRequest, GenerateSQLResponse, ExecuteSQLRequest, ExecuteSQLResponse, RegenerateSQLRequest
from app.services import sql_service, llm_service
from app.utils.prompt_builder import build_llm_prompt, build_llm_prompt_with_history, build_llm_prompt_for_regeneration
from pydantic import BaseModel
from typing import Optional, Dict, Any

router = APIRouter(tags=["sql"])

class DbConnectionInput(BaseModel):
    """Input model that accepts either individual fields or a connection URI"""
    connection_uri: Optional[str] = None
    db_type: Optional[str] = None
    db_host: Optional[str] = None
    db_port: Optional[str] = None
    db_name: Optional[str] = None
    db_user: Optional[str] = None
    db_password: Optional[str] = None

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
        
        # Return a structured error response
        raise HTTPException(
            status_code=422, 
            detail={
                "error": str(e),
                "sql": req.sql,
                "needs_regeneration": True
            }
        )
    
@router.post("/regenerate_sql", response_model=GenerateSQLResponse)
async def regenerate_sql(request: Request, req: RegenerateSQLRequest):
    """Regenerate SQL after a failed attempt"""
    request_id = str(uuid.uuid4())[:8]
    print(f"[API:{request_id}] Regenerate SQL request received: '{req.user_prompt[:50]}...'")
    start_time = time.time()
    
    try:
        # Get database schema
        schema_str, _ = sql_service.get_schema(req.db_connection.dict())
        
        # Create prompt with schema, message history, and error information
        print(f"[API:{request_id}] Creating prompt with schema, history, and error info")
        prompt = build_llm_prompt_for_regeneration(
            req.user_prompt, 
            schema_str,
            req.message_history,
            req.failed_sql,
            req.error_message
        )
        
        # Generate SQL
        provider = req.llm_config.provider
        model = req.llm_config.model or "llama3.2"
        url = req.llm_config.url or "http://localhost:11434/api/generate"
        
        print(f"[API:{request_id}] Calling LLM service for regeneration")
        sql = await llm_service.generate_sql(
            provider=provider,
            model=model,
            url=url,
            prompt=prompt
        )
        
        process_time = time.time() - start_time
        print(f"[API:{request_id}] SQL regeneration completed in {process_time:.2f}s")
        
        return GenerateSQLResponse(sql=sql)
    except Exception as e:
        process_time = time.time() - start_time
        print(f"[ERROR:{request_id}] SQL regeneration failed after {process_time:.2f}s: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    

@router.post("/test_db_connection")
async def test_db_connection(request: Request, db_config: DbConnectionInput):
    """Test if a database connection is valid"""
    request_id = str(uuid.uuid4())[:8]
    print(f"[API:{request_id}] Test database connection request")
    
    try:
        # Convert to dict for compatibility with existing functions
        config_dict = db_config.dict(exclude_none=True)
        result = sql_service.test_db_connection(config_dict)
        print(f"[API:{request_id}] Connection test result: {result['success']}")
        return result
    except Exception as e:
        print(f"[ERROR:{request_id}] Connection test error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# app/api/sql.py - Updated get_db_schema_endpoint function

@router.post("/get_db_schema")
async def get_db_schema_endpoint(request: Request, db_config: DbConnectionInput):
    """Get the database schema in a structured format"""
    request_id = str(uuid.uuid4())[:8]
    print(f"[API:{request_id}] Get database schema request")
    start_time = time.time()
    
    try:
        # Convert to dict for compatibility with existing functions
        config_dict = db_config.dict(exclude_none=True)
        
        # Get the schema with the updated function that returns table counts
        schema_str, schema_dict, table_counts = sql_service.get_schema(config_dict)
        
        process_time = time.time() - start_time
        print(f"[API:{request_id}] Schema processed in {process_time:.2f}s")
        
        return {
            "success": True, 
            "schema": schema_dict,
            "tableCounts": table_counts
        }
    except Exception as e:
        process_time = time.time() - start_time
        print(f"[ERROR:{request_id}] Schema processing failed after {process_time:.2f}s: {str(e)}")
        return {"success": False, "message": str(e)}
    
@router.post("/recommend_visualization")
async def recommend_visualization(request: Request, req: dict):
    """Recommend visualization for query results with improved column selection"""
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
        provider = llm_config.get("provider", "bedrock")
        model = llm_config.get("model", "anthropic.claude-3-7-sonnet-20250219-v1:0")
        url = llm_config.get("url", "")
        
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
        
        # Additional validation for ID columns
        if recommendation.get("visualization", False):
            print(f"[API:{request_id}] Validating column selections")
            
            y_axis = recommendation.get("yAxis", "")
            
            # Check if y-axis appears to be an ID column
            is_id_column = (
                y_axis.lower() == "id" or 
                y_axis.lower().endswith("_id") or 
                (y_axis.lower().endswith("id") and not y_axis.lower() in ["paid", "valid", "invalid"]) or
                "uuid" in y_axis.lower()
            )
            
            # Count distinct values and check if numeric
            y_axis_index = columns.index(y_axis) if y_axis in columns else -1
            
            if y_axis_index != -1:
                # Check if numeric
                is_numeric = True
                for row in rows[:10]:  # Check first 10 rows
                    if y_axis_index < len(row) and row[y_axis_index] is not None:
                        try:
                            float(row[y_axis_index])
                        except (ValueError, TypeError):
                            is_numeric = False
                            break
                
                # If it's an ID column used for y-axis, try to find a better column
                if is_id_column:
                    print(f"[API:{request_id}] Detected ID column '{y_axis}' used for y-axis")
                    
                    # Find a better numeric column that's not an ID
                    better_y_columns = []
                    for col in columns:
                        if col == y_axis:
                            continue
                            
                        col_idx = columns.index(col)
                        col_is_id = (
                            col.lower() == "id" or 
                            col.lower().endswith("_id") or 
                            (col.lower().endswith("id") and not col.lower() in ["paid", "valid", "invalid"]) or
                            "uuid" in col.lower()
                        )
                        
                        if not col_is_id:
                            # Check if numeric
                            col_is_numeric = True
                            for row in rows[:10]:
                                if col_idx < len(row) and row[col_idx] is not None:
                                    try:
                                        float(row[col_idx])
                                    except (ValueError, TypeError):
                                        col_is_numeric = False
                                        break
                            
                            if col_is_numeric:
                                better_y_columns.append(col)
                    
                    if better_y_columns:
                        # Update the recommendation with a better y-axis column
                        recommendation["yAxis"] = better_y_columns[0]
                        recommendation["explanation"] += f" (Changed y-axis from ID column '{y_axis}' to '{better_y_columns[0]}')"
                        print(f"[API:{request_id}] Changed y-axis to '{better_y_columns[0]}'")
            
            # Verify x-axis for pie charts
            if recommendation.get("chartType") == "pie":
                x_axis = recommendation.get("xAxis", "")
                x_axis_index = columns.index(x_axis) if x_axis in columns else -1
                
                if x_axis_index != -1:
                    # Count unique values in x-axis
                    unique_values = set()
                    for row in rows:
                        if x_axis_index < len(row) and row[x_axis_index] is not None:
                            unique_values.add(str(row[x_axis_index]))
                    
                    # Too many segments make pie charts unreadable
                    if len(unique_values) > 8:
                        print(f"[API:{request_id}] Too many unique values for pie chart: {len(unique_values)}")
                        
                        # Fall back to bar chart instead
                        recommendation["chartType"] = "bar"
                        recommendation["explanation"] += f" (Changed to bar chart because pie chart would have too many segments ({len(unique_values)}))"
        
        return recommendation
        
    except Exception as e:
        print(f"[ERROR:{request_id}] Visualization recommendation failed: {str(e)}")
        return {"visualization": False, "error": str(e)}