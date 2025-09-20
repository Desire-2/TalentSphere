FROM python:3.11-slim

WORKDIR /app

# Install system dependencies including Redis client
RUN apt-get update && apt-get install -y \
    gcc \
    redis-tools \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application
COPY . .

# Create directory for database if using SQLite
RUN mkdir -p src/database

# Run database optimization during build
RUN python optimize_database.py || echo "Database optimization will run on startup"

# Set performance environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONOPTIMIZE=1
ENV SLOW_QUERY_THRESHOLD=1.0
ENV DB_POOL_SIZE=10
ENV DB_MAX_OVERFLOW=20
ENV DB_POOL_TIMEOUT=30
ENV DB_POOL_RECYCLE=3600
ENV SQL_ECHO=false
ENV FLASK_ENV=production

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:5001/health || exit 1

# Run the application with Gunicorn
CMD ["gunicorn", "--config", "gunicorn.conf.py", "src.main:app"]
