# app/api/llm.py
from fastapi import APIRouter, HTTPException, Request
import time
import uuid
from app.models.llm import LLMProbeRequest
from app.services import llm_service

router = APIRouter(tags=["llm"])

@router.get("/supported_llm_providers")
async def supported_llm_providers(request: Request):
    """Return a list of supported LLM providers and their configuration options"""
    request_id = str(uuid.uuid4())[:8]
    print(f"[API:{request_id}] Get supported LLM providers request")
    
    try:
        providers = llm_service.get_supported_providers()
        print(f"[API:{request_id}] Returned {len(providers['providers'])} providers")
        return providers
    except Exception as e:
        print(f"[ERROR:{request_id}] Failed to get providers: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/probe_llm")
async def probe_llm(request: Request, req: LLMProbeRequest):
    """Probe an LLM provider to discover available models and capabilities"""
    request_id = str(uuid.uuid4())[:8]
    print(f"[API:{request_id}] Probe LLM request for {req.provider} at {req.url}")
    start_time = time.time()
    
    try:
        result = await llm_service.probe_llm_provider(req.provider, req.url)
        
        process_time = time.time() - start_time
        print(f"[API:{request_id}] LLM probe completed in {process_time:.2f}s")
        
        return result
    except Exception as e:
        process_time = time.time() - start_time
        print(f"[ERROR:{request_id}] LLM probe failed after {process_time:.2f}s: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))