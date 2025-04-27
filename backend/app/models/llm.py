# app/models/llm.py
from pydantic import BaseModel
from typing import List, Optional

class LLMProbeRequest(BaseModel):
    """Request to probe an LLM provider"""
    provider: str
    url: str

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