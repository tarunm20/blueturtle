# run.py
import os
import uvicorn

if __name__ == "__main__":
    # Railway provides PORT environment variable
    port = int(os.environ.get("PORT", 8000))
    
    # Must bind to 0.0.0.0 for Railway
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)