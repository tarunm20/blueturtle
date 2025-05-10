FROM python:3.11-slim

WORKDIR /app

# Copy backend files
COPY backend/ .

# Install dependencies
RUN pip install -r requirements.txt

# Start the server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]