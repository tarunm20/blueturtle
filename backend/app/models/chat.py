# app/models/chat.py
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from app.models.llm import LLMConfig
from app.models.db import DbConnectionRequest

# Chat Message Models
class MessageBase(BaseModel):
    """Base model for chat messages"""
    role: str = Field(..., description="Role of the message sender (user, assistant, system)")
    content: str = Field(..., description="Message content")
    
class MessageCreate(MessageBase):
    """Model for creating a new message"""
    conversation_id: str
    sql: Optional[str] = None
    tokens_used: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    
class MessageResponse(MessageBase):
    """Response model for messages"""
    id: str
    conversation_id: str
    created_at: datetime
    sql: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    tokens_used: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None

# Conversation Models
class ConversationCreate(BaseModel):
    """Model for creating a new conversation"""
    title: Optional[str] = None
    model_type: Optional[str] = None
    model_config: Optional[Dict[str, Any]] = Field(default_factory=dict)
    db_connection_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    
class ConversationUpdate(BaseModel):
    """Model for updating a conversation"""
    title: Optional[str] = None
    model_type: Optional[str] = None
    model_config: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    
class ConversationResponse(BaseModel):
    """Response model for conversations"""
    id: str
    user_id: str
    title: Optional[str]
    created_at: datetime
    updated_at: datetime
    model_type: Optional[str]
    model_config: Dict[str, Any]
    db_connection_id: Optional[str]
    metadata: Dict[str, Any]

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