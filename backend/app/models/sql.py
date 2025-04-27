# app/models/sql.py
from pydantic import BaseModel, Field
from typing import List, Any, Optional

class GenerateSQLRequest(BaseModel):
    """Request to generate SQL from natural language"""
    user_prompt: str
    db_url: str
    llm_config: dict = Field(
        default={
            "provider": "ollama",
            "model": "llama3.2",
            "url": "http://localhost:11434/api/generate"
        },
        description="LLM configuration parameters"
    )

class GenerateSQLResponse(BaseModel):
    """Response containing generated SQL"""
    sql: str

class ExecuteSQLRequest(BaseModel):
    """Request to execute SQL"""
    sql: str
    db_url: str

class ExecuteSQLResponse(BaseModel):
    """Response from SQL execution"""
    columns: List[str]
    rows: List[Any]