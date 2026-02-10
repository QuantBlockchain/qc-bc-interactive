# Use Python 3.12 as base image
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    gcc \
    g++ \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies first for better caching
COPY src/pyproject.toml .
RUN pip install --no-cache-dir fastapi uvicorn jinja2 aiohttp boto3 amazon-braket-sdk requests python-multipart debugpy

# Copy ALL source files to the working directory
COPY src/ /app/
COPY app/db_config.py /app/
COPY app/main.py /app/

# Create directory for persistent data
RUN mkdir -p /app/data

# Expose port
EXPOSE 8001

# Health check with longer start period  
HEALTHCHECK --interval=60s --timeout=10s --start-period=180s --retries=5 \
    CMD curl -f http://localhost:8001/health || exit 1

# Set environment variables
ENV PYTHONPATH=/app
ENV PORT=8001
ENV DEBUG=false

# Run the application
CMD ["python", "/app/main.py"]
