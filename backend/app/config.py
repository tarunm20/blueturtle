# app/config.py
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application settings"""
    # Default LLM settings - changed to use Bedrock with Claude 3.7 Sonnet
    DEFAULT_LLM_PROVIDER: str = "bedrock"
    DEFAULT_LLM_MODEL: str = "anthropic.claude-3-7-sonnet-20250219-v1:0"
    DEFAULT_LLM_URL: str = "http://localhost:11434/api/generate"  # Keep for Ollama fallback
    
    # AWS Bedrock settings
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    BEDROCK_MODEL_ID: str = os.getenv("BEDROCK_MODEL_ID", "anthropic.claude-3-7-sonnet-20250219-v1:0")
    CLAUDE_37_PROFILE_ARN: str = os.getenv("CLAUDE_37_PROFILE_ARN", "")
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "DEBUG")
    
    class Config:
        env_file = ".env"

# Create settings instance
settings = Settings()