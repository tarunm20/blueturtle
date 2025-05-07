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

def build_visualization_prompt(user_question: str, columns: list, rows: list) -> str:
    """Build a prompt to get visualization recommendations for query results"""
    
    # Format sample rows for readability
    sample_rows = rows[:5] if len(rows) > 5 else rows
    sample_data = "\n".join([str(row) for row in sample_rows])
    
    return f"""
    I executed a SQL query in response to the user question: "{user_question}"
    
    The query returned the following data:
    Columns: {columns}
    Sample data (first {len(sample_rows)} rows): 
    {sample_data}
    
    Your task is to analyze this data and suggest an appropriate visualization.

    Guidelines:
    - For count data (like "number of orders per product"), ALWAYS choose a bar chart
    - For time series data (dates, timestamps), use a line chart
    - For proportion data (percentages, parts of a whole), use a pie chart
    - If there are 2+ columns with numbers, the data is ALWAYS suitable for visualization
    - If there's a text column and a numeric column, the data is ALMOST ALWAYS suitable for visualization with the text on x-axis
    - Prefer a bar chart when in doubt, as they work well for most data types

    Answer these questions:
    1. Is this data suitable for visualization? (The answer should be "yes" if there's at least one numeric column)
    2. What type of chart would be most appropriate? (bar, line, pie)
    3. Which column should be used for the X-axis? (Prefer text/categorical/date columns)
    4. Which column(s) should be used for the Y-axis? (Must be numeric)
    5. What would be an appropriate title for this chart?
    
    Respond ONLY with a JSON object in the following format:
    {{
      "visualization": true/false,
      "chartType": "bar/line/pie",
      "xAxis": "column_name",
      "yAxis": "column_name",
      "title": "Suggested chart title",
      "explanation": "Brief explanation of why this visualization makes sense"
    }}
    """