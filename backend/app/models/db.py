# app/models/db.py
from pydantic import BaseModel, Field
from typing import Optional, Dict, List

class DbConnectionRequest(BaseModel):
    """Database connection request model"""
    db_type: str = Field(..., description="Database type (postgres, mysql, mssql, sqlite)")
    db_host: Optional[str] = Field(None, description="Database host address")
    db_port: Optional[str] = Field(None, description="Database port")
    db_name: str = Field(..., description="Database name or file path for SQLite")
    db_user: Optional[str] = Field(None, description="Database username")
    db_password: Optional[str] = Field(None, description="Database password")

class DbConnectionResponse(BaseModel):
    """Database connection test response"""
    success: bool
    message: str

class SchemaResponse(BaseModel):
    """Database schema response"""
    success: bool
    schema: Optional[Dict[str, List[str]]] = None
    message: Optional[str] = None