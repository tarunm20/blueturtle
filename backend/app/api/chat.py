# app/api/chat.py
from fastapi import APIRouter, HTTPException, Request, Depends
import time
import uuid
from app.models.chat import (
    ChatRequest, ChatResponse, 
    ConversationCreate, ConversationResponse, ConversationUpdate,
    MessageCreate, MessageResponse,
    ConversationListResponse, MessageListResponse
)
from app.services import llm_service
from app.utils.prompt_builder import build_chat_prompt
from app.utils.colors import Colors as C

router = APIRouter(tags=["chat"])

@router.post("/chat", response_model=ChatResponse)
async def chat(request: Request, req: ChatRequest):
    """Send a chat message and get a response"""
    request_id = str(uuid.uuid4())[:8]
    print(f"{C.API}[API:{request_id}]{C.RESET} Chat request received: '{req.message[:50]}...'")
    start_time = time.time()
    
    try:
        # Determine if this is a new or existing conversation
        conversation_id = req.conversation_id
        is_new_conversation = conversation_id is None
        
        # TODO: If using Supabase, you'll interact with it here
        # For now, let's just generate a response from the LLM
        
        # Build the prompt for the LLM
        # This will need to include context from previous messages
        # if it's an existing conversation
        prompt = build_chat_prompt(
            user_message=req.message,
            conversation_id=conversation_id,
            db_connection=req.db_connection
        )
        
        # Generate response using LLM service
        llm_config = req.llm_config or {
            "provider": "ollama",
            "model": "llama3.2",
            "url": "http://localhost:11434/api/generate"
        }
        
        # Call LLM service
        response = await llm_service.generate_chat_response(
            provider=llm_config.get("provider", "ollama"),
            model=llm_config.get("model", "llama3.2"),
            url=llm_config.get("url", "http://localhost:11434/api/generate"),
            prompt=prompt
        )
        
        # Extract SQL if any was generated
        sql = None
        result = None
        if "sql" in response:
            sql = response["sql"]
            # Here you would execute the SQL if needed
        
        process_time = time.time() - start_time
        print(f"{C.API}[API:{request_id}]{C.RESET} Chat response generated in {process_time:.2f}s")
        
        # For this mock implementation, we'll return a simulated response
        # In a real implementation, you'd store the conversation and messages in Supabase
        
        if is_new_conversation:
            conversation_id = str(uuid.uuid4())
        
        return ChatResponse(
            conversation_id=conversation_id,
            message=MessageResponse(
                id=str(uuid.uuid4()),
                conversation_id=conversation_id,
                role="assistant",
                content=response.get("content", "I'm sorry, I couldn't process your request."),
                created_at=time.time(),
                sql=sql,
                result=result,
                tokens_used=response.get("tokens_used", 0)
            ),
            sql=sql,
            result=result
        )
    
    except Exception as e:
        process_time = time.time() - start_time
        print(f"{C.ERROR}[ERROR:{request_id}]{C.RESET} Chat request failed after {process_time:.2f}s: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/conversations", response_model=ConversationResponse)
async def create_conversation(request: Request, req: ConversationCreate):
    """Create a new conversation"""
    request_id = str(uuid.uuid4())[:8]
    print(f"{C.API}[API:{request_id}]{C.RESET} Create conversation request")
    
    try:
        # TODO: In a real implementation, you'd create a conversation in Supabase
        # For now, we'll just return a mock response
        
        conversation_id = str(uuid.uuid4())
        return ConversationResponse(
            id=conversation_id,
            user_id=request.state.user_id if hasattr(request.state, "user_id") else "anonymous",
            title=req.title or "New Conversation",
            created_at=time.time(),
            updated_at=time.time(),
            model_type=req.model_type,
            model_config=req.model_config or {},
            db_connection_id=req.db_connection_id,
            metadata=req.metadata or {}
        )
    
    except Exception as e:
        print(f"{C.ERROR}[ERROR:{request_id}]{C.RESET} Create conversation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversations", response_model=ConversationListResponse)
async def list_conversations(request: Request):
    """List all conversations for the current user"""
    request_id = str(uuid.uuid4())[:8]
    print(f"{C.API}[API:{request_id}]{C.RESET} List conversations request")
    
    try:
        # TODO: In a real implementation, you'd fetch conversations from Supabase
        # For now, we'll just return an empty list
        
        return ConversationListResponse(conversations=[])
    
    except Exception as e:
        print(f"{C.ERROR}[ERROR:{request_id}]{C.RESET} List conversations failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(request: Request, conversation_id: str):
    """Get a specific conversation"""
    request_id = str(uuid.uuid4())[:8]
    print(f"{C.API}[API:{request_id}]{C.RESET} Get conversation request: {conversation_id}")
    
    try:
        # TODO: In a real implementation, you'd fetch the conversation from Supabase
        # For now, we'll just return a mock response
        
        return ConversationResponse(
            id=conversation_id,
            user_id=request.state.user_id if hasattr(request.state, "user_id") else "anonymous",
            title="Mock Conversation",
            created_at=time.time(),
            updated_at=time.time(),
            model_type="ollama",
            model_config={},
            db_connection_id=None,
            metadata={}
        )
    
    except Exception as e:
        print(f"{C.ERROR}[ERROR:{request_id}]{C.RESET} Get conversation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/conversations/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(request: Request, conversation_id: str, req: ConversationUpdate):
    """Update a conversation"""
    request_id = str(uuid.uuid4())[:8]
    print(f"{C.API}[API:{request_id}]{C.RESET} Update conversation request: {conversation_id}")
    
    try:
        # TODO: In a real implementation, you'd update the conversation in Supabase
        # For now, we'll just return a mock response
        
        return ConversationResponse(
            id=conversation_id,
            user_id=request.state.user_id if hasattr(request.state, "user_id") else "anonymous",
            title=req.title or "Updated Conversation",
            created_at=time.time(),
            updated_at=time.time(),
            model_type=req.model_type or "ollama",
            model_config=req.model_config or {},
            db_connection_id=None,
            metadata=req.metadata or {}
        )
    
    except Exception as e:
        print(f"{C.ERROR}[ERROR:{request_id}]{C.RESET} Update conversation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(request: Request, conversation_id: str):
    """Delete a conversation"""
    request_id = str(uuid.uuid4())[:8]
    print(f"{C.API}[API:{request_id}]{C.RESET} Delete conversation request: {conversation_id}")
    
    try:
        # TODO: In a real implementation, you'd delete the conversation from Supabase
        # For now, we'll just return a success response
        
        return {"success": True}
    
    except Exception as e:
        print(f"{C.ERROR}[ERROR:{request_id}]{C.RESET} Delete conversation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversations/{conversation_id}/messages", response_model=MessageListResponse)
async def list_messages(request: Request, conversation_id: str):
    """List all messages for a conversation"""
    request_id = str(uuid.uuid4())[:8]
    print(f"{C.API}[API:{request_id}]{C.RESET} List messages request for conversation: {conversation_id}")
    
    try:
        # TODO: In a real implementation, you'd fetch messages from Supabase
        # For now, we'll just return an empty list
        
        return MessageListResponse(messages=[])
    
    except Exception as e:
        print(f"{C.ERROR}[ERROR:{request_id}]{C.RESET} List messages failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))