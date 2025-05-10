# app/utils/bedrock_client.py
import boto3
import json
from botocore.exceptions import ClientError
from app.config import settings
from app.utils.colors import Colors as C

def create_bedrock_client():
    """Create and return a Bedrock client"""
    try:
        client = boto3.client(
            service_name='bedrock-runtime',
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )
        print(f"{C.LLM}[BEDROCK]{C.RESET} Successfully created Bedrock client")
        return client
    except ClientError as e:
        print(f"{C.ERROR}[ERROR]{C.RESET} Failed to create Bedrock client: {e}")
        raise

def invoke_anthropic_bedrock(client, model_id: str, prompt: str) -> str:
    """Invoke Anthropic Claude on Bedrock"""
    try:
        print(f"{C.LLM}[BEDROCK]{C.RESET} Invoking Anthropic model: {model_id}")
        
        # Check if we're using Claude 3.7 Sonnet - if so, use the profile ARN
        if "claude-3-7-sonnet" in model_id and settings.CLAUDE_37_PROFILE_ARN:
            invoke_model_id = settings.CLAUDE_37_PROFILE_ARN
            print(f"{C.LLM}[BEDROCK]{C.RESET} Using Claude 3.7 Sonnet profile ARN")
        else:
            invoke_model_id = model_id
        
        # Anthropic Claude specific format
        body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4096,
            "temperature": 0.1,
            "top_p": 0.9,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }
        
        response = client.invoke_model(
            modelId=invoke_model_id,
            contentType="application/json",
            accept="application/json",
            body=json.dumps(body)
        )
        
        response_body = json.loads(response['body'].read())
        
        # Extract response from Anthropic format
        if "content" in response_body:
            content = response_body["content"]
            if isinstance(content, list) and len(content) > 0:
                return content[0].get("text", "")
        
        return response_body.get("completion", "")
        
    except ClientError as e:
        print(f"{C.ERROR}[ERROR]{C.RESET} Bedrock model invocation failed: {e}")
        raise