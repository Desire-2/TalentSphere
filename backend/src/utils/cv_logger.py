"""
Structured Logging Configuration for CV Builder
Provides JSON-formatted logs for better monitoring and debugging
"""
import logging
import json
import sys
from datetime import datetime
from typing import Any, Dict


class StructuredLogger:
    """
    Structured logger that outputs JSON-formatted logs
    """
    
    def __init__(self, name: str, log_level: str = 'INFO'):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(getattr(logging, log_level.upper()))
        
        # Remove existing handlers
        self.logger.handlers = []
        
        # Add structured handler
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(StructuredFormatter())
        self.logger.addHandler(handler)
    
    def info(self, message: str, **kwargs):
        """Log info level message with structured data"""
        self.logger.info(message, extra=kwargs)
    
    def warning(self, message: str, **kwargs):
        """Log warning level message with structured data"""
        self.logger.warning(message, extra=kwargs)
    
    def error(self, message: str, error: Exception = None, **kwargs):
        """Log error level message with structured data"""
        if error:
            kwargs['error_type'] = type(error).__name__
            kwargs['error_message'] = str(error)
        self.logger.error(message, extra=kwargs)
    
    def debug(self, message: str, **kwargs):
        """Log debug level message with structured data"""
        self.logger.debug(message, extra=kwargs)


class StructuredFormatter(logging.Formatter):
    """
    Custom formatter that outputs JSON-structured logs
    """
    
    def format(self, record):
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }
        
        # Add extra fields
        if hasattr(record, '__dict__'):
            for key, value in record.__dict__.items():
                if key not in ['name', 'msg', 'args', 'created', 'filename', 'funcName',
                              'levelname', 'levelno', 'lineno', 'module', 'msecs',
                              'message', 'pathname', 'process', 'processName',
                              'relativeCreated', 'thread', 'threadName', 'exc_info',
                              'exc_text', 'stack_info']:
                    log_data[key] = value
        
        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)
        
        return json.dumps(log_data)


# CV Builder specific logger
cv_logger = StructuredLogger('cv_builder')


class CVGenerationLogger:
    """
    Specialized logger for CV generation tracking
    """
    
    def __init__(self):
        self.logger = cv_logger
        self.generation_start_time = None
        self.section_times = {}
    
    def log_generation_start(self, user_id: int, job_id: int = None, sections: list = None):
        """Log the start of CV generation"""
        self.generation_start_time = datetime.utcnow()
        self.logger.info(
            "CV generation started",
            event_type="cv_generation_start",
            user_id=user_id,
            job_id=job_id,
            sections=sections,
            timestamp=self.generation_start_time.isoformat()
        )
    
    def log_section_start(self, section: str):
        """Log the start of a section generation"""
        self.section_times[section] = {'start': datetime.utcnow()}
        self.logger.debug(
            f"Section generation started: {section}",
            event_type="section_start",
            section=section
        )
    
    def log_section_complete(self, section: str, status: str = 'success', error: str = None):
        """Log the completion of a section generation"""
        if section in self.section_times:
            end_time = datetime.utcnow()
            duration = (end_time - self.section_times[section]['start']).total_seconds()
            
            self.logger.info(
                f"Section generation completed: {section}",
                event_type="section_complete",
                section=section,
                status=status,
                duration_seconds=duration,
                error=error
            )
    
    def log_api_call(self, provider: str, attempt: int, success: bool, error: str = None):
        """Log API call attempts"""
        self.logger.info(
            f"API call to {provider}",
            event_type="api_call",
            provider=provider,
            attempt=attempt,
            success=success,
            error=error
        )
    
    def log_generation_complete(self, user_id: int, sections_generated: int, 
                               ats_score: int = None, status: str = 'success', error: str = None):
        """Log the completion of CV generation"""
        if self.generation_start_time:
            duration = (datetime.utcnow() - self.generation_start_time).total_seconds()
        else:
            duration = None
        
        self.logger.info(
            "CV generation completed",
            event_type="cv_generation_complete",
            user_id=user_id,
            status=status,
            sections_generated=sections_generated,
            ats_score=ats_score,
            total_duration_seconds=duration,
            error=error
        )
    
    def log_error(self, error_type: str, message: str, **kwargs):
        """Log errors with context"""
        self.logger.error(
            message,
            event_type="error",
            error_type=error_type,
            **kwargs
        )


# Export singleton instance
cv_generation_logger = CVGenerationLogger()
