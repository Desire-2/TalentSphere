# Gunicorn Configuration for TalentSphere Backend
# Optimized for performance

import multiprocessing
import os

# Server socket
bind = f"0.0.0.0:{os.getenv('PORT', '5000')}"
backlog = 2048

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100

# Timeout settings
timeout = 30
keepalive = 2

# Process naming
proc_name = "talentsphere-backend"

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Memory optimization
preload_app = True
max_worker_memory = 400 * 1024 * 1024  # 400MB per worker

# Security
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

# Performance
sendfile = True
reuse_port = True
enable_stdio_inheritance = True
