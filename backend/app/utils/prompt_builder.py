# app/utils/prompt_builder.py
def build_llm_prompt(user_prompt: str, schema: str) -> str:
    """Build a prompt for a single user query"""
    return f"""
    You are an expert SQL assistant.
    Given the following database schema and a user request, write a correct SQL SELECT query that fulfills the request.
    Your query must only use standard SQL features and functions.

    Schema:
    {schema}

    User request:
    {user_prompt}
    
    Output only the SQL. Do not include explanations, comments, or additional text.
    The output must be a valid SQL query that can be executed directly on the database.
    Format the response as a single-line SQL query with no unnecessary whitespace or line breaks.
    Return a single JSON object in the following format:
    {{
    "query": "your_query_here"
    }}
    """