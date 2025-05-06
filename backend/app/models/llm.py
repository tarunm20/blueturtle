# app/models/llm.py
from pydantic import BaseModel, Field
from typing import Optional, List

class LLMConfigField(BaseModel):
    """Configuration field for an LLM provider"""
    name: str
    type: str
    default: Optional[str] = None
    required: bool = False
    description: Optional[str] = None

class LLMProvider(BaseModel):
    """LLM provider information"""
    id: str
    name: str
    config_fields: List[LLMConfigField]

class LLMProbeRequest(BaseModel):
    """Request to probe an LLM provider"""
    provider: str
    url: str

class LLMConfig(BaseModel):
    """LLM configuration parameters"""
    provider: str = Field(..., description="LLM provider (ollama, openai, custom)")
    model: Optional[str] = Field(default=None, description="Model name")
    url: Optional[str] = Field(default=None, description="API URL for custom providers")
    apiKey: Optional[str] = Field(default=None, description="API key for providers like OpenAI")
    
    class Config:
        # This ensures extra attributes are ignored
        extra = "ignore"