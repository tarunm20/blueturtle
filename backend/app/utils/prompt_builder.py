# app/utils/prompt_builder.py
def build_llm_prompt(user_prompt: str, schema: str) -> str:
    """Build a prompt for a single user query"""
    return f"""
You are an expert SQL assistant.
Given the following database schema and a user request, write a correct SQL query that fulfills the request.

Schema:
{schema}

User request:
{user_prompt}

Return the SQL query as a JSON object with a "query" field:
{{"query": "your_sql_query_here"}}
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
Given the following database schema and chat history, write a correct SQL query that fulfills the user's request.

Schema:
{schema}

{history_text}Current request:
{user_prompt}

Return the SQL query as a JSON object with a "query" field:
{{"query": "your_sql_query_here"}}
"""

def build_visualization_prompt(user_question: str, columns: list, rows: list) -> str:
    """Build a prompt to get visualization recommendations for query results"""
    
    # Format sample rows for readability
    sample_rows = rows[:5] if len(rows) > 5 else rows
    sample_data = "\n".join([str(row) for row in sample_rows])
    
    return f"""
I executed a SQL query for the question: "{user_question}"

Results:
Columns: {columns}
Sample data: 
{sample_data}

Analyze this data and recommend the best visualization type.

Return response as JSON:
{{
  "visualization": true/false,
  "chartType": "bar/line/pie",
  "xAxis": "column_name",
  "yAxis": "column_name",
  "title": "Chart title",
  "explanation": "Brief explanation"
}}
"""

def build_llm_prompt_for_regeneration(user_prompt: str, schema: str, message_history, failed_sql: str, error_message: str) -> str:
    """Build a prompt for regenerating SQL after a failed attempt"""
    history_text = ""
    
    if message_history and len(message_history) > 0:
        history_text = "Previous conversation:\n"
        for msg in message_history:
            role = "User" if msg.role == "user" else "Assistant"
            history_text += f"{role}: {msg.content}\n"
        
        history_text += "\n"
    
    return f"""
You are an expert SQL assistant.
The previous SQL query failed. Please fix it based on the error message.

Schema:
{schema}

{history_text}User request:
{user_prompt}

Failed SQL:
{failed_sql}

Error message:
{error_message}

Generate a corrected SQL query as a JSON object:
{{"query": "your_corrected_sql_query"}}
"""


def build_chat_prompt(user_prompt: str, schema: str, conversation_history=None) -> str:
    """Build a chat prompt for general conversation"""
    history_text = ""
    
    if conversation_history:
        history_text = "Previous conversation:\n"
        for msg in conversation_history:
            role = "User" if msg.get("role") == "user" else "Assistant"
            history_text += f"{role}: {msg.get('content', '')}\n"
        history_text += "\n"
    
    return f"""
You are a helpful SQL assistant.
Schema: {schema}

{history_text}User: {user_prompt}

Respond naturally to the user's message. If they ask for SQL, provide it. If they ask a general question, answer it helpfully.
"""