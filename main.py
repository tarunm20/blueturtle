from fastapi import FastAPI, HTTPException, Body
from utils.db_utils import get_db_schema
from utils.prompt_builder import build_llm_prompt
from utils.parse_response import parse_ollama_response
import httpx
import psycopg
import json

app = FastAPI()

OLLAMA_MODEL = "llama3.2"
OLLAMA_URL = "http://localhost:11434/api/generate"


@app.post("/generate_sql")
async def generate_sql(
    user_prompt: str = Body(...),
    db_url: str = Body(...)
):
    print(f"\n[DEBUG] user_prompt: {user_prompt}")
    print(f"[DEBUG] db_url: {db_url}")

    try:
        schema = get_db_schema(db_url)
        print(f"[DEBUG] schema:\n{schema}")
    except Exception as e:
        print(f"[ERROR] get_db_schema failed: {e}")
        raise HTTPException(status_code=500, detail=f"DB error: {e}")

    try:
        full_prompt = build_llm_prompt(user_prompt, schema)
        print(f"[DEBUG] full_prompt:\n{full_prompt}")
    except Exception as e:
        print(f"[ERROR] build_llm_prompt failed: {e}")
        raise HTTPException(status_code=500, detail=f"Prompt building error: {e}")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(OLLAMA_URL, json={
                "model": OLLAMA_MODEL,
                "prompt": full_prompt,
                "stream": True,
                "format": "json",
            })

            print(f"[DEBUG] Ollama status: {response.status_code}")
            response.raise_for_status()

            generated_response = ""
            async for line in response.aiter_lines():
                if line.strip() == "":
                    continue
                try:
                    data = json.loads(line)
                    print(f"[DEBUG] JSON Chunk: {data}")
                    if "response" in data:
                        generated_response += data["response"]
                    if data.get("done", False):
                        break
                except json.JSONDecodeError as e:
                    print(f"[DEBUG] JSON Decode Error: {e}")
                    continue
            
            print(generated_response)
            sql = parse_ollama_response(generated_response)
            print(f"[DEBUG] Generated SQL: {sql}")
            return {"sql": sql}

    except Exception as e:
        print(f"[ERROR] Ollama call failed: {e}")
        raise HTTPException(status_code=500, detail=f"LLM error: {e}")


@app.post("/execute_sql")
async def execute_sql(
    sql: str = Body(...),
    db_url: str = Body(...)
):
    print(f"\n[DEBUG] sql: {sql}")
    print(f"[DEBUG] db_url: {db_url}")

    try:
        with psycopg.connect(db_url) as conn:
            with conn.cursor() as cur:
                cur.execute(sql)
                columns = [desc.name for desc in cur.description]
                rows = cur.fetchall()
                print(f"[DEBUG] Columns: {columns}")
                print(f"[DEBUG] Rows: {rows}")
                return {"columns": columns, "rows": rows}
    except Exception as e:
        print(f"[ERROR] SQL execution failed: {e}")
        raise HTTPException(status_code=500, detail=f"SQL error: {e}")


@app.get("/")
async def welcome():
    return {"response": "Hello World!"}
