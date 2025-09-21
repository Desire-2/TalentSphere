# Optimized Gunicorn Configuration for TalentSphere Backend
# Ultra-high performance settings

import multiprocessing
import os

# Server socket configuration
bind = f"0.0.0.0:{os.getenv('PORT', '5000')}"
backlog = 4096  # Increased backlog for high traffic

# Worker processes - optimized for performance
workers = int(os.getenv('GUNICORN_WORKERS', multiprocessing.cpu_count() * 2 + 1))
worker_class = os.getenv('GUNICORN_WORKER_CLASS', 'sync')
worker_connections = int(os.getenv('GUNICORN_WORKER_CONNECTIONS', '1500'))
max_requests = int(os.getenv('GUNICORN_MAX_REQUESTS', '2000'))
max_requests_jitter = int(os.getenv('GUNICORN_MAX_REQUESTS_JITTER', '200'))

# Timeout settings - optimized for performance
timeout = int(os.getenv('GUNICORN_TIMEOUT', '45'))
keepalive = int(os.getenv('GUNICORN_KEEPALIVE', '5'))
graceful_timeout = 30

# Process naming and management
proc_name = "talentsphere-backend-optimized"
daemon = False
pidfile = "/tmp/gunicorn.pid"
user = None
group = None
tmp_upload_dir = None

# Logging configuration
accesslog = "-"
errorlog = "-"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s %(M)s'

# Performance optimizations
preload_app = bool(os.getenv('GUNICORN_PRELOAD_APP', 'true').lower() == 'true')
max_worker_memory = 500 * 1024 * 1024  # 500MB per worker (increased)
worker_tmp_dir = "/dev/shm"  # Use shared memory for better performance

# Security settings
limit_request_line = 8190  # Increased for larger requests
limit_request_fields = 150  # Increased for complex APIs
limit_request_field_size = 16380  # Increased for larger headers

# Network optimizations
sendfile = True
reuse_port = True
enable_stdio_inheritance = True

# SSL/TLS settings (if using HTTPS)
keyfile = None
certfile = None
ssl_version = 2  # TLS
ciphers = 'TLSv1'
ca_certs = None
suppress_ragged_eofs = True
do_handshake_on_connect = False

# Worker lifecycle hooks for performance monitoring
def on_starting(server):
    """Called just before the master process is initialized."""
    server.log.info("Starting TalentSphere Backend Server (Optimized)")

def on_reload(server):
    """Called to recycle workers during a reload via SIGHUP."""
    server.log.info("Reloading TalentSphere Backend Server")

def when_ready(server):
    """Called just after the server is started."""
    server.log.info(f"TalentSphere Backend ready with {workers} workers")
    server.log.info(f"Worker class: {worker_class}")
    server.log.info(f"Max requests per worker: {max_requests}")
    server.log.info(f"Preload app: {preload_app}")

def worker_int(worker):
    """Called just after a worker exited on SIGINT or SIGQUIT."""
    worker.log.info(f"Worker {worker.pid} received INT or QUIT signal")

def pre_fork(server, worker):
    """Called just before a worker is forked."""
    server.log.debug(f"About to fork worker {worker.pid}")

def post_fork(server, worker):
    """Called just after a worker has been forked."""
    server.log.debug(f"Worker {worker.pid} forked successfully")
    
    # Set process title for monitoring
    import setproctitle
    setproctitle.setproctitle(f"talentsphere-worker-{worker.pid}")

def pre_exec(server):
    """Called just before a new master process is forked."""
    server.log.info("Forked child, re-executing.")

def worker_abort(worker):
    """Called when a worker receives the SIGABRT signal."""
    worker.log.info(f"Worker {worker.pid} received SIGABRT signal")

# Environment-specific overrides
flask_env = os.getenv('FLASK_ENV', 'production')

if flask_env == 'development':
    # Development settings
    workers = 2
    timeout = 120
    loglevel = "debug"
    reload = True
    preload_app = False
elif flask_env == 'testing':
    # Testing settings
    workers = 1
    timeout = 60
    loglevel = "warning"
    preload_app = False
else:
    # Production settings (already optimized above)
    pass

# Memory and performance monitoring
def worker_memory_monitor(worker):
    """Monitor worker memory usage"""
    try:
        import psutil
        process = psutil.Process(worker.pid)
        memory_mb = process.memory_info().rss / 1024 / 1024
        
        if memory_mb > max_worker_memory / 1024 / 1024:
            worker.log.warning(
                f"Worker {worker.pid} using {memory_mb:.1f}MB memory "
                f"(limit: {max_worker_memory / 1024 / 1024:.1f}MB)"
            )
    except Exception:
        pass

# Performance tuning based on system resources
try:
    import psutil
    
    # Adjust workers based on available memory
    available_memory_gb = psutil.virtual_memory().available / (1024 ** 3)
    if available_memory_gb < 2:
        workers = min(workers, 2)
        max_worker_memory = 256 * 1024 * 1024  # 256MB per worker
    elif available_memory_gb > 8:
        workers = min(workers, multiprocessing.cpu_count() * 3)
        max_worker_memory = 800 * 1024 * 1024  # 800MB per worker
    
    # Adjust based on CPU cores
    cpu_count = multiprocessing.cpu_count()
    if cpu_count == 1:
        workers = 2
        worker_connections = 500
    elif cpu_count >= 8:
        workers = min(workers, cpu_count * 2)
        worker_connections = 2000
        
except ImportError:
    pass  # psutil not available, use defaults

# Final logging of configuration
def log_config():
    """Log the current configuration"""
    config_info = f"""
TalentSphere Backend Gunicorn Configuration:
- Workers: {workers}
- Worker Class: {worker_class}
- Worker Connections: {worker_connections}
- Max Requests: {max_requests}
- Timeout: {timeout}s
- Keepalive: {keepalive}s
- Preload App: {preload_app}
- Max Worker Memory: {max_worker_memory / 1024 / 1024:.0f}MB
- Flask Environment: {flask_env}
    """
    print(config_info)

# Call configuration logging
log_config()