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
    
    # Ensure the app is configured for production
    if os.getenv('FLASK_ENV') == 'production':
        app.config['DEBUG'] = False
        logger.info("Production mode enabled")
    
    # Initialize missing tables on startup unless explicitly disabled.
    # Default ON (matching src.main's server-mode branch): create_all() is
    # additive, so each boot only adds tables the current code introduced.
    # Production served 503s on every Career Agent profile read because a
    # boot without this step left career_memories uncreated.
    if os.getenv('INIT_DB_ON_STARTUP', 'true').lower() != 'false':
        try:
            with app.app_context():
                from src.models.user import db
                db.create_all()
                from src.models.career_agent import ensure_career_agent_indexes
                ensure_career_agent_indexes()
                logger.info("Database tables initialized successfully")
        except Exception as db_error:
            logger.exception("Database initialization failed: %s", db_error)
            logger.info("Database will be initialized on first request")
    else:
        logger.info("Database initialization deferred to first API request")
        
except Exception as e:
    logger.error(f"Failed to import Flask application: {e}")
    raise

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
