# run.py
import os
import uvicorn

if __name__ == "__main__":
    # Railway provides PORT environment variable
    # Get port from environment or default to 8000
    port = int(os.environ.get("PORT", "8000"))
    
    print(f"Starting server on port: {port}")
    
    # Must bind to 0.0.0.0 for Railway
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)