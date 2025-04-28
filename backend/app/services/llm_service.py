# app/services/llm_service.py
import httpx
import json
import time
import re
from fastapi import HTTPException
from app.utils.response_parser import parse_ollama_response
from app.utils.colors import Colors as C

async def generate_sql(provider: str, model: str, url: str, prompt: str) -> str:
    """Generate SQL from natural language using an LLM"""
    print(f"{C.LLM}[LLM]{C.RESET} Using provider: {provider}, model: {model}")
    
    if provider == "ollama":
        return await handle_ollama_request(url, model, prompt)
    elif provider == "openai":
        print(f"{C.ERROR}[ERROR]{C.RESET} OpenAI implementation not complete")
        raise ValueError(f"OpenAI implementation not complete")
    else:
        print(f"{C.ERROR}[ERROR]{C.RESET} Unsupported LLM provider: {provider}")
        raise ValueError(f"Unsupported LLM provider: {provider}")

async def handle_ollama_request(url: str, model: str, prompt: str) -> str:
    """Handle requests to Ollama API"""
    print(f"{C.LLM}[LLM]{C.RESET} Sending request to Ollama at {url}")
    request_start = time.time()
    
    # Use default URL if not provided
    if not url:
        url = "http://localhost:11434/api/generate"
    
    # Use default model if not provided
    if not model:
        model = "llama3.2"
    
    async with httpx.AsyncClient() as client:
        try:
            print(f"{C.LLM}[LLM]{C.RESET} Requesting completion from model {model}...")
            response = await client.post(url, json={
                "model": model,
                "prompt": prompt,
                "stream": True,
                "format": "json",
            })

            print(f"{C.LLM}[LLM]{C.RESET} Ollama responded with status {response.status_code}")
            response.raise_for_status()

            generated_response = ""
            print(f"{C.LLM}[LLM]{C.RESET} Starting to receive streaming response...")
            
            async for line in response.aiter_lines():
                if line.strip() == "":
                    continue
                try:
                    data = json.loads(line)
                    if "response" in data:
                        generated_response += data["response"]
                    if data.get("done", False):
                        break
                except json.JSONDecodeError:
                    continue
            
            total_time = time.time() - request_start
            print(f"{C.LLM}[LLM]{C.RESET} Received full response in {total_time:.2f}s")
            
            sql = parse_ollama_response(generated_response)
            print(f"{C.LLM}[LLM]{C.RESET} Extracted SQL query: {sql}")
            
            return sql
            
        except httpx.HTTPStatusError as e:
            print(f"{C.ERROR}[ERROR]{C.RESET} Ollama API error: {e.response.status_code} - {e.response.text}")
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"Ollama API error: {e.response.text}"
            )
        except Exception as e:
            print(f"{C.ERROR}[ERROR]{C.RESET} LLM request failed: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"LLM error: {str(e)}"
            )

async def probe_llm_provider(provider: str, url: str) -> dict:
    """Probe an LLM provider to discover capabilities"""
    print(f"{C.LLM}[LLM]{C.RESET} Probing provider: {provider} at {url}")
    
    if provider == "ollama":
        try:
            models = await get_ollama_models(url)
            print(f"{C.LLM}[LLM]{C.RESET} Found {len(models)} Ollama models")
            return {
                "provider": "ollama",
                "available": True,
                "models": models
            }
        except Exception as e:
            print(f"{C.ERROR}[ERROR]{C.RESET} Ollama probe failed: {str(e)}")
            return {
                "provider": "ollama",
                "available": False,
                "error": str(e)
            }
    else:
        print(f"{C.WARNING}[WARNING]{C.RESET} Unsupported provider: {provider}")
        return {
            "provider": provider,
            "available": False,
            "error": "Unsupported provider"
        }

async def get_ollama_models(url: str) -> list:
    """Get available models from an Ollama server"""
    print(f"{C.LLM}[LLM]{C.RESET} Getting available Ollama models...")
    
    # Default URL if not provided
    if not url:
        url = "http://localhost:11434"
    
    # Extract the base URL (remove the /api/generate part if present)
    base_url = url
    if "/api/" in base_url:
        base_url = base_url.split("/api/")[0]
    
    # Ensure the URL ends with a slash if needed
    if not base_url.endswith("/"):
        base_url += "/"
    
    # Append the API endpoint for listing models
    models_url = f"{base_url}api/tags"
    print(f"{C.LLM}[LLM]{C.RESET} Using models endpoint: {models_url}")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(models_url, timeout=5.0)
            print(f"{C.LLM}[LLM]{C.RESET} Models API response: {response.status_code}")
            
            response.raise_for_status()
            data = response.json()
            
            # Extract model names from Ollama's response format
            if "models" in data:
                models = [model.get("name") for model in data["models"]]
                print(f"{C.LLM}[LLM]{C.RESET} Available models: {', '.join(models[:5])}" + 
                      ("..." if len(models) > 5 else ""))
                return models
            else:
                print(f"{C.WARNING}[WARNING]{C.RESET} No models found in Ollama response")
                return []
                
    except Exception as e:
        print(f"{C.ERROR}[ERROR]{C.RESET} Failed to get Ollama models: {str(e)}")
        raise ValueError(f"Failed to get Ollama models: {str(e)}")

def get_supported_providers() -> dict:
    """Get a list of supported LLM providers"""
    print(f"{C.LLM}[LLM]{C.RESET} Getting supported providers")
    return {
        "providers": [
            {
                "id": "ollama",
                "name": "Ollama",
                "config_fields": [
                    {"name": "model", "type": "string", "default": "llama3.2", "description": "Model name"},
                    {"name": "url", "type": "string", "default": "http://localhost:11434/api/generate", "description": "Ollama API URL"}
                ]
            }
        ]
    }