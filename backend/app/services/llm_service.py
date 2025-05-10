# app/services/llm_service.py
import boto3
import httpx
import json
import time
import re
from fastapi import HTTPException
from app.utils.colors import Colors as C
from app.utils.response_parser import parse_ollama_response
from app.utils.bedrock_client import create_bedrock_client, invoke_anthropic_bedrock
from app.config import settings

async def generate_sql(provider: str, model: str, url: str, prompt: str) -> str:
    """Generate SQL from natural language using an LLM"""
    print(f"{C.LLM}[LLM]{C.RESET} Using provider: {provider}, model: {model}")
    
    if provider == "bedrock":
        return await handle_bedrock_request(model, prompt)
    elif provider == "ollama":
        return await handle_ollama_request(url, model, prompt)
    elif provider == "openai":
        print(f"{C.ERROR}[ERROR]{C.RESET} OpenAI implementation not complete")
        raise ValueError(f"OpenAI implementation not complete")
    else:
        print(f"{C.ERROR}[ERROR]{C.RESET} Unsupported LLM provider: {provider}")
        raise ValueError(f"Unsupported LLM provider: {provider}")

async def handle_bedrock_request(model: str, prompt: str) -> str:
    """Handle requests to AWS Bedrock with Anthropic Claude"""
    print(f"{C.LLM}[LLM]{C.RESET} Sending request to Bedrock with model {model}")
    request_start = time.time()
    
    try:
        # Create Bedrock client
        client = create_bedrock_client()
        
        # Use Claude 3.7 Sonnet if no model specified
        if not model:
            model = settings.BEDROCK_MODEL_ID
        
        print(f"{C.LLM}[LLM]{C.RESET} Requesting completion from model {model}...")
        
        # Invoke Anthropic model on Bedrock
        response_text = invoke_anthropic_bedrock(client, model, prompt)
        
        total_time = time.time() - request_start
        print(f"{C.LLM}[LLM]{C.RESET} Received response in {total_time:.2f}s")
        
        # Parse the response for SQL
        sql = extract_sql_from_response(response_text)
        
        print(f"{C.LLM}[LLM]{C.RESET} Extracted SQL query: {sql}")
        
        return sql
        
    except Exception as e:
        print(f"{C.ERROR}[ERROR]{C.RESET} Bedrock request failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Bedrock error: {str(e)}"
        )

def extract_sql_from_response(response_text: str) -> str:
    """Extract SQL from response, handling various formats"""
    try:
        # First try to parse as JSON
        response_data = json.loads(response_text)
        if "query" in response_data:
            return response_data["query"]
    except json.JSONDecodeError:
        pass
    
    # Look for SQL in JSON format within text
    json_match = re.search(r'\{\s*"query"\s*:\s*"([^"]+)"\s*\}', response_text)
    if json_match:
        return json_match.group(1)
    
    # Look for SQL between code blocks
    code_block_match = re.search(r'```sql\n(.*?)\n```', response_text, re.DOTALL)
    if code_block_match:
        return code_block_match.group(1).strip()
    
    # Look for SQL without code blocks
    sql_match = re.search(r'SELECT.*?(?:;|$)', response_text, re.DOTALL | re.IGNORECASE)
    if sql_match:
        return sql_match.group(0).strip()
    
    # If no SQL found, use existing parser as fallback
    return parse_ollama_response(response_text)

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
            
            # Request with JSON format option
            response = await client.post(url, json={
                "model": model,
                "prompt": prompt,
                "stream": False,
                "format": "json"
            }, timeout=60.0)

            print(f"{C.LLM}[LLM]{C.RESET} Ollama responded with status {response.status_code}")
            response.raise_for_status()

            # Parse the JSON response
            response_data = response.json()
            total_time = time.time() - request_start
            print(f"{C.LLM}[LLM]{C.RESET} Received response in {total_time:.2f}s")
            
            # Extract the response text
            if "response" in response_data:
                response_text = response_data["response"]
                
                # Use the existing response parser to extract SQL
                sql = parse_ollama_response(response_text)
                print(f"{C.LLM}[LLM]{C.RESET} Extracted SQL query: {sql}")
                
                return sql
            else:
                print(f"{C.ERROR}[ERROR]{C.RESET} Unexpected response format")
                raise ValueError("Unexpected response format from LLM")
            
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
    
    if provider == "bedrock":
        try:
            # Create Bedrock client for listing models
            bedrock_client = boto3.client(
                service_name='bedrock',
                region_name=settings.AWS_REGION,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
            )
            
            # Actually test the connection by listing models
            print(f"{C.LLM}[LLM]{C.RESET} Testing Bedrock connection...")
            response = bedrock_client.list_foundation_models()
            
            # Filter to only Anthropic models
            anthropic_models = []
            for model in response.get('modelSummaries', []):
                if 'anthropic' in model.get('providerName', '').lower():
                    anthropic_models.append({
                        "id": model.get('modelId', ''),
                        "name": model.get('modelName', ''),
                        "provider": model.get('providerName', '')
                    })
            
            print(f"{C.LLM}[LLM]{C.RESET} Found {len(anthropic_models)} Anthropic models")
            
            # Test if we can actually invoke a model
            test_model = "anthropic.claude-3-haiku-20240307-v1:0"  # Use Haiku for quick test
            try:
                runtime_client = create_bedrock_client()
                test_response = runtime_client.invoke_model(
                    modelId=test_model,
                    contentType="application/json",
                    accept="application/json",
                    body=json.dumps({
                        "anthropic_version": "bedrock-2023-05-31",
                        "max_tokens": 10,
                        "messages": [{"role": "user", "content": "Hi"}]
                    })
                )
                invoke_test_passed = True
            except Exception as invoke_error:
                print(f"{C.WARNING}[WARNING]{C.RESET} Model invocation test failed: {invoke_error}")
                invoke_test_passed = False
            
            return {
                "provider": "bedrock",
                "available": True,
                "models": anthropic_models,
                "invoke_test_passed": invoke_test_passed,
                "test_model_used": test_model
            }
            
        except Exception as e:
            print(f"{C.ERROR}[ERROR]{C.RESET} Bedrock probe failed: {str(e)}")
            return {
                "provider": "bedrock",
                "available": False,
                "error": str(e),
                "error_type": type(e).__name__
            }
    elif provider == "ollama":
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
                "id": "bedrock",
                "name": "AWS Bedrock (Claude 3.7 Sonnet)",
                "config_fields": [
                    {"name": "model", "type": "string", "default": "anthropic.claude-3-7-sonnet-20250219-v1:0", "description": "Model ID"},
                    {"name": "region", "type": "string", "default": "us-east-1", "description": "AWS region"}
                ]
            },
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