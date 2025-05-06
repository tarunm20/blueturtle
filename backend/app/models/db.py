# app/models/db.py
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class DbConnectionRequest(BaseModel):
    """Database connection request model"""
    db_type: str = Field(..., description="Database type (postgres, mysql, mssql, sqlite)")
    db_host: Optional[str] = Field(None, description="Database host (not needed for SQLite)")
    db_port: Optional[str] = Field(None, description="Database port (not needed for SQLite)")
    db_name: str = Field(..., description="Database name or file path for SQLite")
    db_user: Optional[str] = Field(None, description="Database username (not needed for SQLite)")
    db_password: Optional[str] = Field(None, description="Database password (not needed for SQLite)")
    
    class Config:
        # This ensures extra attributes are ignored
        extra = "ignore"