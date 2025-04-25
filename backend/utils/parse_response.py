import json

def parse_ollama_response(response_str: str) -> str:
    try:
        response_json = json.loads(response_str)
        return response_json.get("query").strip()
    except json.JSONDecodeError:
        return response_str.strip()
