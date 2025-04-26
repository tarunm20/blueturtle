from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from utils.db_utils import get_db_schema
from utils.prompt_builder import build_llm_prompt
from utils.parse_response import parse_ollama_response
import httpx
import psycopg
import json
import logging

# Setup logging
logging.basicConfig(level=logging.DEBUG)

app = FastAPI()

# CORS middleware for handling cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (or specify allowed origins)
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, OPTIONS)
    allow_headers=["*"],  # Allow all headers
)

# Pydantic models for request bodies
class GenerateSQLRequest(BaseModel):
    user_prompt: str
    db_url: str

class ExecuteSQLRequest(BaseModel):
    sql: str
    db_url: str

OLLAMA_MODEL = "llama3.2"
OLLAMA_URL = "http://localhost:11434/api/generate"


@app.post("/generate_sql")
async def generate_sql(request: GenerateSQLRequest):
    user_prompt = request.user_prompt
    db_url = request.db_url
    logging.debug(f"user_prompt: {user_prompt}")
    logging.debug(f"db_url: {db_url}")

    try:
        schema = get_db_schema(db_url)
        logging.debug(f"schema: {schema}")
    except Exception as e:
        logging.error(f"get_db_schema failed: {e}")
        raise HTTPException(status_code=500, detail=f"DB error: {e}")

    try:
        full_prompt = build_llm_prompt(user_prompt, schema)
        logging.debug(f"full_prompt: {full_prompt}")
    except Exception as e:
        logging.error(f"build_llm_prompt failed: {e}")
        raise HTTPException(status_code=500, detail=f"Prompt building error: {e}")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(OLLAMA_URL, json={
                "model": OLLAMA_MODEL,
                "prompt": full_prompt,
                "stream": True,
                "format": "json",
            })

            logging.debug(f"Ollama status: {response.status_code}")
            response.raise_for_status()

            generated_response = ""
            async for line in response.aiter_lines():
                if line.strip() == "":
                    continue
                try:
                    data = json.loads(line)
                    logging.debug(f"JSON Chunk: {data}")
                    if "response" in data:
                        generated_response += data["response"]
                    if data.get("done", False):
                        break
                except json.JSONDecodeError as e:
                    logging.debug(f"JSON Decode Error: {e}")
                    continue
            
            logging.debug(f"Generated response: {generated_response}")
            sql = parse_ollama_response(generated_response)
            logging.debug(f"Generated SQL: {sql}")
            return {"sql": sql}

    except Exception as e:
        logging.error(f"Ollama call failed: {e}")
        raise HTTPException(status_code=500, detail=f"LLM error: {e}")


@app.post("/execute_sql")
async def execute_sql(request: ExecuteSQLRequest):
    sql = request.sql
    db_url = request.db_url
    logging.debug(f"sql: {sql}")
    logging.debug(f"db_url: {db_url}")

    try:
        with psycopg.connect(db_url) as conn:
            with conn.cursor() as cur:
                cur.execute(sql)
                columns = [desc.name for desc in cur.description]
                rows = cur.fetchall()
                logging.debug(f"Columns: {columns}")
                logging.debug(f"Rows: {rows}")
                return {"columns": columns, "rows": rows}
    except Exception as e:
        logging.error(f"SQL execution failed: {e}")
        raise HTTPException(status_code=500, detail=f"SQL error: {e}")


@app.get("/")
async def welcome():
    return {"response": "Hello World!"}
