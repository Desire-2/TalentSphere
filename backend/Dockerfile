FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application
COPY . .

# Make build script executable
RUN chmod +x build.sh

# Expose port
EXPOSE 5001

# Run the application
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "wsgi:app"]
