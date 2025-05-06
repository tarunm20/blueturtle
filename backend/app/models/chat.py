# app/models/chat.py
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.models.llm import LLMConfig
from app.models.db import DbConnectionRequest

# Chat Message Models
class MessageBase(BaseModel):
    """Base model for chat messages"""
    role: str
    content: str
    
class MessageCreate(MessageBase):
    """Model for creating a new message"""
    conversation_id: str
    sql: Optional[str] = None
    tokens_used: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None
    
class MessageResponse(MessageBase):
    """Response model for messages"""
    id: str
    conversation_id: str
    created_at: float  # Using float for timestamp
    sql: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    tokens_used: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None

# Conversation Models
class ConversationCreate(BaseModel):
    """Model for creating a new conversation"""
    title: Optional[str] = None
    model_type: Optional[str] = None
    model_settings: Optional[Dict[str, Any]] = None  # Changed from model_config
    db_connection_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    
class ConversationUpdate(BaseModel):
    """Model for updating a conversation"""
    title: Optional[str] = None
    model_type: Optional[str] = None
    model_settings: Optional[Dict[str, Any]] = None  # Changed from model_config
    metadata: Optional[Dict[str, Any]] = None
    
class ConversationResponse(BaseModel):
    """Response model for conversations"""
    id: str
    user_id: str
    title: Optional[str] = None
    created_at: float  # Using float for timestamp
    updated_at: float  # Using float for timestamp
    model_type: Optional[str] = None
    model_settings: Dict[str, Any] = {}  # Changed from model_config
    db_connection_id: Optional[str] = None
    metadata: Dict[str, Any] = {}

# Chat Request/Response Models
class ChatRequest(BaseModel):
    """Request model for chat API"""
    conversation_id: Optional[str] = None
    message: str
    db_connection: Optional[DbConnectionRequest] = None
    llm_config: Optional[LLMConfig] = None
    
class ChatResponse(BaseModel):
    """Response model for chat API"""
    conversation_id: str
    message: MessageResponse
    sql: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    
class ConversationListResponse(BaseModel):
    """Response model for listing conversations"""
    conversations: List[ConversationResponse]
    
class MessageListResponse(BaseModel):
    """Response model for listing messages"""
    messages: List[MessageResponse]