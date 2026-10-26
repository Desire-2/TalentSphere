# Gunicorn Configuration for TalentSphere Backend
# Optimized for Render deployment

import multiprocessing
import os

# Server socket - Render uses PORT environment variable
bind = f"0.0.0.0:{os.getenv('PORT', '10000')}"
backlog = 1024

# Worker processes - bounded by the database connection budget. SQLAlchemy
# creates one pool per worker, so CPU-based worker counts can exhaust managed
# PostgreSQL slots even when each individual pool looks small.
requested_workers = int(os.getenv('WEB_CONCURRENCY', os.getenv('GUNICORN_WORKERS', '1')))
max_web_workers = max(1, int(os.getenv('MAX_WEB_WORKERS', '2')))
workers = max(1, min(requested_workers, max_web_workers))
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

    try:
        from src.main import app
    except Exception as e:
        server.log.error(f"Failed to load Flask app in worker {worker.pid}: {e}")
        return

    # preload_app forks after importing Flask-SQLAlchemy. Do not share any
    # connection or pool state inherited from the Gunicorn master.
    try:
        from src.models.user import db
        with app.app_context():
            db.engine.dispose(close=False)
    except Exception as e:
        server.log.warning(f"Could not reset inherited DB pool in worker {worker.pid}: {e}")

    # Each worker runs a lightweight DB-backed Career Agent recovery loop.
    # execute_package claims rows atomically, so multiple workers do not run
    # the same generation, while a worker restart can resume stranded work.
    try:
        from src.services.career_agent.worker import start_career_agent_worker
        start_career_agent_worker(app)
        server.log.info(f"Career Agent background worker started in worker {worker.pid}")
    except Exception as e:
        server.log.error(f"Career Agent background worker failed in worker {worker.pid}: {e}")
    
    # Environment variables are copied when Gunicorn forks, so they cannot
    # coordinate scheduler ownership between worker processes. Gunicorn's
    # monotonic worker age identifies the first worker in the process group.
    if worker.age == 1:
        try:
            from src.services.job_digest_scheduler import job_digest_scheduler
            job_digest_scheduler.start(app)
            server.log.info(f"✅ Job digest scheduler started in worker {worker.pid} (scheduler process)")
        except Exception as e:
            server.log.error(f"❌ Failed to start job digest scheduler in worker {worker.pid}: {e}")

        if os.getenv('ENABLE_CLEANUP_SERVICE', 'false').lower() == 'true':
            try:
                from src.services.cleanup_service import start_cleanup_service
                service = start_cleanup_service(app)
                if service and service.is_running:
                    server.log.info(f"✅ Cleanup service started in worker {worker.pid} (scheduler process)")
                else:
                    server.log.warning(f"⚠️  Cleanup service initialization issue in worker {worker.pid}")
            except Exception as e:
                server.log.error(f"❌ Failed to start cleanup service in worker {worker.pid}: {e}")
        else:
            server.log.info("Cleanup service disabled (ENABLE_CLEANUP_SERVICE is not true)")
    else:
        # Scheduler already running in another worker process
        server.log.info("Worker %s - background schedulers owned by worker age 1", worker.pid)

def worker_abort(worker):
    """Called when a worker received the SIGABRT signal."""
    worker.log.info(f"Worker {worker.pid} received SIGABRT signal")
