# app/models/sql.py
from pydantic import BaseModel, Field
from typing import List, Any, Dict, Optional
from app.models.db import DbConnectionRequest

class LLMConfig(BaseModel):
    """LLM configuration parameters"""
    provider: str = Field(..., description="LLM provider (ollama, openai, custom)")
    model: Optional[str] = Field(default=None, description="Model name")
    url: Optional[str] = Field(default=None, description="API URL for custom providers")
    apiKey: Optional[str] = Field(default=None, description="API key for providers like OpenAI")
    
    class Config:
        # This ensures extra attributes are ignored
        extra = "ignore"

class GenerateSQLRequest(BaseModel):
    """Request to generate SQL from natural language"""
    user_prompt: str
    db_connection: DbConnectionRequest
    llm_config: LLMConfig = Field(
        default=LLMConfig(
            provider="ollama",
            model="llama3.2",
            url="http://localhost:11434/api/generate"
        ),
        description="LLM configuration parameters"
    )

class GenerateSQLResponse(BaseModel):
    """Response containing generated SQL"""
    sql: str

class ExecuteSQLRequest(BaseModel):
    """Request to execute SQL"""
    sql: str
    db_connection: DbConnectionRequest

class ExecuteSQLResponse(BaseModel):
    """Response from SQL execution"""
    columns: List[str]
    rows: List[Any]