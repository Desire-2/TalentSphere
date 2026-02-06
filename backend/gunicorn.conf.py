# Gunicorn Configuration for TalentSphere Backend
# Optimized for Render deployment

import multiprocessing
import os

# Server socket - Render uses PORT environment variable
bind = f"0.0.0.0:{os.getenv('PORT', '10000')}"
backlog = 1024

# Worker processes - Optimized for Render's resource limits
workers = min(multiprocessing.cpu_count(), 4)  # Max 4 workers for Render free/starter
worker_class = "sync"
worker_connections = 1000
max_requests = 2000
max_requests_jitter = 200
worker_tmp_dir = "/dev/shm"  # Use memory for worker temp files

# Timeout settings - Render-optimized
timeout = 120  # Render allows up to 120 seconds
keepalive = 5
graceful_timeout = 30

# Process naming
proc_name = "talentsphere-backend"

# Logging - Render captures stdout/stderr
accesslog = "-"
errorlog = "-"
loglevel = "info"
capture_output = True
enable_stdio_inheritance = True

# Memory optimization for Render
preload_app = True
max_worker_memory = 300 * 1024 * 1024  # 300MB per worker (Render limit consideration)

# Security
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

# Performance optimizations
sendfile = True
reuse_port = True

# Render-specific optimizations
def on_starting(server):
    """Called just before the master process is initialized."""
    server.log.info("Starting TalentSphere Backend on Render")

def on_reload(server):
    """Called to recycle workers during a reload via SIGHUP."""
    server.log.info("Reloading TalentSphere Backend")

def worker_int(worker):
    """Called just after a worker exited on SIGINT or SIGQUIT."""
    worker.log.info(f"Worker {worker.pid} received INT or QUIT signal")

def pre_fork(server, worker):
    """Called just before a worker is forked."""
    server.log.info(f"Worker {worker.age} spawned")

def post_fork(server, worker):
    """Called just after a worker has been forked."""
    server.log.info(f"Worker {worker.pid} booted")
    
    # Only start cleanup service in worker 1 (age 0) to avoid duplicate schedulers
    if worker.age == 0:
        try:
            from src.services.cleanup_service import start_cleanup_service
            service = start_cleanup_service()
            if service and service.is_running:
                server.log.info(f"✅ Cleanup service started in worker {worker.pid} (primary worker)")
            else:
                server.log.warning(f"⚠️  Cleanup service initialization issue in worker {worker.pid}")
        except Exception as e:
            server.log.error(f"❌ Failed to start cleanup service in worker {worker.pid}: {e}")
            import traceback
            traceback.print_exc()
    else:
        # Other workers just acknowledge the service is running elsewhere
        server.log.info(f"Worker {worker.pid} - cleanup service runs in primary worker")

def worker_abort(worker):
    """Called when a worker received the SIGABRT signal."""
    worker.log.info(f"Worker {worker.pid} received SIGABRT signal")
