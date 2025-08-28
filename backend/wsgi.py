#!/usr/bin/env python3
"""
WSGI entry point for production deployment
"""
import os
import sys
import logging

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from src.main import app
    logger.info("Flask application imported successfully")
except Exception as e:
    logger.error(f"Failed to import Flask application: {e}")
    raise

# Ensure the app is configured for production
if os.getenv('FLASK_ENV') == 'production':
    app.config['DEBUG'] = False
    logger.info("Production mode enabled")

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
