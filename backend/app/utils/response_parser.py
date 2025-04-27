# app/utils/response_parser.py
import json
import re
from app.utils.colors import Colors as C

def parse_ollama_response(response_str: str) -> str:
    """Parse the response from Ollama to extract SQL query"""
    print(f"{C.PARSER}[PARSER]{C.RESET} Parsing response of length {len(response_str)}")
    
    try:
        # First try to parse as JSON
        print(f"{C.PARSER}[PARSER]{C.RESET} Attempting to parse as JSON")
        response_json = json.loads(response_str)
        if "query" in response_json:
            sql = response_json.get("query", "").strip()
            print(f"{C.PARSER}[PARSER]{C.RESET} Successfully extracted SQL from JSON")
            return sql
        else:
            print(f"{C.PARSER}[PARSER]{C.RESET} JSON response did not contain 'query' field")
    except json.JSONDecodeError:
        print(f"{C.PARSER}[PARSER]{C.RESET} Not valid JSON, trying regex extraction")
        
        # If not valid JSON, try to extract with regex
        try:
            match = re.search(r'\{\s*"query"\s*:\s*"([^"]+)"\s*\}', response_str)
            if match:
                sql = match.group(1).strip()
                print(f"{C.PARSER}[PARSER]{C.RESET} Successfully extracted SQL with regex")
                return sql
            else:
                print(f"{C.WARNING}[WARNING]{C.RESET} Could not find SQL query with regex")
        except Exception as e:
            print(f"{C.ERROR}[ERROR]{C.RESET} Regex extraction failed: {str(e)}")
    
    # If both methods fail, return the raw response
    print(f"{C.WARNING}[WARNING]{C.RESET} Returning raw response as SQL")
    return response_str.strip()