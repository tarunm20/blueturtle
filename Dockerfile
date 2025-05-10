FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Set working directory
WORKDIR /app

# Copy only backend files to the container
COPY backend/ ./

# Install system dependencies for database drivers
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose port (Railway will assign the actual port)
EXPOSE 8000

# Use your existing run.py file which handles PORT correctly
CMD ["python", "run.py"]