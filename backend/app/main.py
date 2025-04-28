# app/main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import time
import uuid
from app.config import settings
from app.api import sql, llm
from app.utils.colors import Colors as C

app = FastAPI(
    title="SQL Assistant API",
    description="API for generating SQL queries from natural language using LLMs and SQLAlchemy",
    version="1.0.0",
)

# CORS middleware for handling cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Include routers
app.include_router(sql.router)
app.include_router(llm.router)

# Add basic request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    # Generate a short request ID
    request_id = str(uuid.uuid4())[:8]
    
    # Add request ID to request state for use in endpoint handlers
    request.state.request_id = request_id
    
    # Log the request
    print(f"{C.REQUEST}[REQUEST:{request_id}]{C.RESET} {request.method} {request.url.path}")
    
    # Record start time
    start_time = time.time()
    
    # Process the request
    response = await call_next(request)
    
    # Calculate request duration
    process_time = time.time() - start_time
    
    # Choose color based on status code
    status_color = C.GREEN if response.status_code < 400 else C.RED
    
    print(f"{C.RESPONSE}[RESPONSE:{request_id}]{C.RESET} Completed with status {status_color}{response.status_code}{C.RESET} in {process_time:.2f}s")
    
    return response

@app.get("/")
async def root():
    """Root endpoint"""
    print(f"{C.API}[API]{C.RESET} Root endpoint accessed")
    return {
        "message": "Welcome to the SQL Assistant API",
        "documentation": "/docs",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    print(f"{C.API}[API]{C.RESET} Health check endpoint accessed")
    return {"status": "healthy", "database_backends": ["SQLAlchemy"]}