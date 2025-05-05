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

def build_chat_prompt(user_message: str, conversation_id: str = None, db_connection = None) -> str:
    """Build a prompt for a chat message"""
    # If a database connection is provided, include schema information
    schema_str = ""
    if db_connection:
        try:
            # This assumes you have a function to get the schema
            # You'll need to implement this based on your existing code
            from app.services.sql_service import get_schema
            schema_str, _ = get_schema(db_connection)
        except Exception as e:
            print(f"Error getting schema: {e}")
    
    # Build a system prompt that guides the LLM's behavior
    system_prompt = """
    You are an expert SQL assistant in a chat interface. Your job is to help users analyze their 
    databases by converting their natural language questions into SQL queries and explaining the results.
    
    Follow these rules:
    1. If the user asks a question about their data, generate a SQL query to answer it
    2. Format your response as a JSON object with these fields:
       - "content": your explanation and answer to the user
       - "sql": the SQL query you generated (if applicable)
    3. Keep your responses helpful, concise, and focused on the data
    4. If you need more information, ask clarifying questions
    5. Always validate the SQL query to ensure it's correct before returning it
    """
    
    # If we have schema information, add it to the system prompt
    if schema_str:
        system_prompt += f"\n\nDatabase Schema:\n{schema_str}"
    
    # Build the final prompt
    prompt = f"""
    {system_prompt}
    
    User: {user_message}
    
    Assistant:
    """
    
    return prompt