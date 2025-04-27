# app/config.py
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application settings"""
    # Default LLM settings
    DEFAULT_LLM_PROVIDER: str = "ollama"
    DEFAULT_LLM_MODEL: str = "llama3.2"
    DEFAULT_LLM_URL: str = "http://localhost:11434/api/generate"
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "DEBUG")
    
    class Config:
        env_file = ".env"

# Create settings instance
settings = Settings()