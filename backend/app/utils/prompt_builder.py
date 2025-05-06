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

def build_llm_prompt_with_history(user_prompt: str, schema: str, message_history=None) -> str:
    """Build a prompt for a query with chat history context"""
    history_text = ""
    
    if message_history and len(message_history) > 0:
        history_text = "Previous conversation:\n"
        for msg in message_history:
            role = "User" if msg.role == "user" else "Assistant"
            history_text += f"{role}: {msg.content}\n"
        
        history_text += "\n"
    
    return f"""
    You are an expert SQL assistant.
    Given the following database schema, chat history, and a user request, write a correct SQL query that fulfills the request.
    
    Schema:
    {schema}
    
    {history_text}
    User's current request:
    {user_prompt}
    
    Output only the SQL query as a JSON object with a "query" field. Do not include explanations or comments.
    Example: {{"query": "SELECT * FROM users WHERE id = 1"}}
    """