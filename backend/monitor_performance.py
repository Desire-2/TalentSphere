"""
Performance Monitoring Dashboard for TalentSphere Backend

Real-time monitoring of database performance, cache efficiency, and system resources.
"""

import time
import psutil
import threading
from datetime import datetime, timedelta
from flask import Flask, jsonify, render_template_string
from sqlalchemy import text
import json

from src.main import app
from src.models.user import db
from src.utils.performance import performance_monitor, ConnectionPoolMonitor
from src.utils.cache_middleware import advanced_cache
from src.utils.db_optimization import get_performance_stats, slow_queries

class PerformanceDashboard:
    """Performance monitoring dashboard"""
    
    def __init__(self):
        self.monitoring_data = {
            'start_time': datetime.utcnow(),
            'system_stats': [],
            'database_stats': [],
            'cache_stats': [],
            'api_stats': []
        }
        self.monitoring_active = False
        self.monitoring_thread = None
    
    def start_monitoring(self, interval=30):
        """Start background monitoring"""
        if self.monitoring_active:
            return
        
        self.monitoring_active = True
        self.monitoring_thread = threading.Thread(target=self._monitor_loop, args=(interval,))
        self.monitoring_thread.daemon = True
        self.monitoring_thread.start()
        print(f"✅ Performance monitoring started (interval: {interval}s)")
    
    def stop_monitoring(self):
        """Stop background monitoring"""
        self.monitoring_active = False
        if self.monitoring_thread:
            self.monitoring_thread.join(timeout=5)
        print("🛑 Performance monitoring stopped")
    
    def _monitor_loop(self, interval):
        """Background monitoring loop"""
        while self.monitoring_active:
            try:
                # Collect system stats
                system_stats = self._get_system_stats()
                self.monitoring_data['system_stats'].append(system_stats)
                
                # Collect database stats
                with app.app_context():
                    db_stats = self._get_database_stats()
                    self.monitoring_data['database_stats'].append(db_stats)
                
                # Collect cache stats
                cache_stats = self._get_cache_stats()
                self.monitoring_data['cache_stats'].append(cache_stats)
                
                # Collect API stats
                api_stats = self._get_api_stats()
                self.monitoring_data['api_stats'].append(api_stats)
                
                # Keep only last 100 entries for each metric
                for key in self.monitoring_data:
                    if isinstance(self.monitoring_data[key], list) and len(self.monitoring_data[key]) > 100:
                        self.monitoring_data[key] = self.monitoring_data[key][-100:]
                
                time.sleep(interval)
                
            except Exception as e:
                print(f"Monitoring error: {str(e)}")
                time.sleep(interval)
    
    def _get_system_stats(self):
        """Get current system statistics"""
        try:
            process = psutil.Process()
            
            return {
                'timestamp': datetime.utcnow().isoformat(),
                'cpu_percent': psutil.cpu_percent(interval=0.1),
                'memory_percent': psutil.virtual_memory().percent,
                'memory_used_mb': psutil.virtual_memory().used / 1024 / 1024,
                'memory_available_mb': psutil.virtual_memory().available / 1024 / 1024,
                'disk_usage_percent': psutil.disk_usage('/').percent,
                'process_memory_mb': process.memory_info().rss / 1024 / 1024,
                'process_cpu_percent': process.cpu_percent(),
                'load_average': list(psutil.getloadavg()) if hasattr(psutil, 'getloadavg') else None,
                'open_files': len(process.open_files()),
                'connections': len(process.connections()),
                'threads': process.num_threads()
            }
        except Exception as e:
            return {'error': str(e), 'timestamp': datetime.utcnow().isoformat()}
    
    def _get_database_stats(self):
        """Get database performance statistics"""
        try:
            # Connection pool stats
            pool_stats = ConnectionPoolMonitor.get_pool_stats()
            
            # Database query stats
            db_perf_stats = get_performance_stats()
            
            # Recent slow queries
            recent_slow_queries = slow_queries[-10:] if slow_queries else []
            
            # Database size (SQLite specific)
            db_size = 0
            try:
                if 'sqlite' in str(db.engine.url).lower():
                    result = db.session.execute(text("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()")).fetchone()
                    db_size = result[0] if result else 0
                else:
                    # PostgreSQL database size
                    result = db.session.execute(text("SELECT pg_database_size(current_database())")).fetchone()
                    db_size = result[0] if result else 0
            except Exception:
                pass
            
            return {
                'timestamp': datetime.utcnow().isoformat(),
                'pool_stats': pool_stats,
                'slow_queries_count': len(slow_queries),
                'recent_slow_queries': recent_slow_queries,
                'database_size_mb': db_size / 1024 / 1024 if db_size else 0,
                'connection_healthy': pool_stats.get('healthy', False)
            }
        except Exception as e:
            return {'error': str(e), 'timestamp': datetime.utcnow().isoformat()}
    
    def _get_cache_stats(self):
        """Get cache performance statistics"""
        try:
            cache_stats = advanced_cache.get_stats()
            
            # Redis-specific stats if available
            redis_stats = {}
            if advanced_cache.redis_client and advanced_cache.enabled:
                try:
                    redis_info = advanced_cache.redis_client.info()
                    redis_stats = {
                        'used_memory_mb': redis_info.get('used_memory', 0) / 1024 / 1024,
                        'connected_clients': redis_info.get('connected_clients', 0),
                        'total_commands_processed': redis_info.get('total_commands_processed', 0),
                        'keyspace_hits': redis_info.get('keyspace_hits', 0),
                        'keyspace_misses': redis_info.get('keyspace_misses', 0),
                        'evicted_keys': redis_info.get('evicted_keys', 0)
                    }
                    
                    # Calculate Redis hit rate
                    total_requests = redis_stats['keyspace_hits'] + redis_stats['keyspace_misses']
                    redis_hit_rate = (redis_stats['keyspace_hits'] / total_requests * 100) if total_requests > 0 else 0
                    redis_stats['hit_rate_percent'] = round(redis_hit_rate, 2)
                    
                except Exception:
                    redis_stats = {'error': 'Redis stats unavailable'}
            
            return {
                'timestamp': datetime.utcnow().isoformat(),
                'cache_stats': cache_stats,
                'redis_stats': redis_stats
            }
        except Exception as e:
            return {'error': str(e), 'timestamp': datetime.utcnow().isoformat()}
    
    def _get_api_stats(self):
        """Get API performance statistics"""
        try:
            api_stats = performance_monitor.get_performance_stats()
            
            return {
                'timestamp': datetime.utcnow().isoformat(),
                'api_performance': api_stats
            }
        except Exception as e:
            return {'error': str(e), 'timestamp': datetime.utcnow().isoformat()}
    
    def get_dashboard_data(self):
        """Get all monitoring data for dashboard"""
        uptime = datetime.utcnow() - self.monitoring_data['start_time']
        
        return {
            'status': 'active' if self.monitoring_active else 'inactive',
            'uptime_seconds': uptime.total_seconds(),
            'uptime_formatted': str(uptime).split('.')[0],  # Remove microseconds
            'data_points': len(self.monitoring_data.get('system_stats', [])),
            **self.monitoring_data
        }
    
    def get_summary_stats(self):
        """Get summary statistics"""
        try:
            # Recent system stats (last 10 entries)
            recent_system = self.monitoring_data['system_stats'][-10:]
            recent_db = self.monitoring_data['database_stats'][-10:]
            recent_cache = self.monitoring_data['cache_stats'][-10:]
            
            # Calculate averages
            avg_cpu = sum(s.get('cpu_percent', 0) for s in recent_system) / len(recent_system) if recent_system else 0
            avg_memory = sum(s.get('memory_percent', 0) for s in recent_system) / len(recent_system) if recent_system else 0
            
            # Cache hit rate
            cache_hit_rate = 0
            if recent_cache:
                latest_cache = recent_cache[-1]
                cache_stats = latest_cache.get('cache_stats', {})
                cache_hit_rate = cache_stats.get('hit_rate_percent', 0)
            
            # Database health
            db_healthy = True
            if recent_db:
                latest_db = recent_db[-1]
                db_healthy = latest_db.get('connection_healthy', True)
            
            return {
                'system_health': {
                    'cpu_avg_percent': round(avg_cpu, 2),
                    'memory_avg_percent': round(avg_memory, 2),
                    'status': 'healthy' if avg_cpu < 80 and avg_memory < 85 else 'warning'
                },
                'database_health': {
                    'connection_healthy': db_healthy,
                    'slow_queries': len(slow_queries),
                    'status': 'healthy' if db_healthy and len(slow_queries) < 10 else 'warning'
                },
                'cache_health': {
                    'enabled': advanced_cache.enabled,
                    'hit_rate_percent': cache_hit_rate,
                    'status': 'healthy' if advanced_cache.enabled and cache_hit_rate > 50 else 'warning'
                }
            }
        except Exception as e:
            return {'error': str(e)}

# Global dashboard instance
dashboard = PerformanceDashboard()

# Dashboard HTML template
DASHBOARD_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>TalentSphere Performance Dashboard</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #2c3e50; }
        .metric { display: flex; justify-content: space-between; margin: 10px 0; }
        .metric-value { font-weight: bold; }
        .status-healthy { color: #27ae60; }
        .status-warning { color: #f39c12; }
        .status-error { color: #e74c3c; }
        .chart-container { height: 200px; background: #ecf0f1; border-radius: 4px; margin: 10px 0; }
        .refresh-btn { background: #3498db; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        .refresh-btn:hover { background: #2980b9; }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 TalentSphere Performance Dashboard</h1>
            <p>Real-time monitoring of backend performance metrics</p>
            <button class="refresh-btn" onclick="location.reload()">🔄 Refresh</button>
        </div>
        
        <div class="stats-grid">
            <!-- System Health -->
            <div class="stat-card">
                <div class="stat-title">💻 System Health</div>
                <div class="metric">
                    <span>CPU Usage:</span>
                    <span class="metric-value status-{{ 'healthy' if system_health.cpu_avg_percent < 80 else 'warning' }}">
                        {{ system_health.cpu_avg_percent }}%
                    </span>
                </div>
                <div class="metric">
                    <span>Memory Usage:</span>
                    <span class="metric-value status-{{ 'healthy' if system_health.memory_avg_percent < 85 else 'warning' }}">
                        {{ system_health.memory_avg_percent }}%
                    </span>
                </div>
                <div class="metric">
                    <span>Status:</span>
                    <span class="metric-value status-{{ system_health.status }}">
                        {{ system_health.status.title() }}
                    </span>
                </div>
            </div>
            
            <!-- Database Health -->
            <div class="stat-card">
                <div class="stat-title">🗄️ Database Health</div>
                <div class="metric">
                    <span>Connection:</span>
                    <span class="metric-value status-{{ 'healthy' if database_health.connection_healthy else 'error' }}">
                        {{ 'Connected' if database_health.connection_healthy else 'Disconnected' }}
                    </span>
                </div>
                <div class="metric">
                    <span>Slow Queries:</span>
                    <span class="metric-value status-{{ 'healthy' if database_health.slow_queries < 10 else 'warning' }}">
                        {{ database_health.slow_queries }}
                    </span>
                </div>
                <div class="metric">
                    <span>Status:</span>
                    <span class="metric-value status-{{ database_health.status }}">
                        {{ database_health.status.title() }}
                    </span>
                </div>
            </div>
            
            <!-- Cache Health -->
            <div class="stat-card">
                <div class="stat-title">⚡ Cache Health</div>
                <div class="metric">
                    <span>Enabled:</span>
                    <span class="metric-value status-{{ 'healthy' if cache_health.enabled else 'error' }}">
                        {{ 'Yes' if cache_health.enabled else 'No' }}
                    </span>
                </div>
                <div class="metric">
                    <span>Hit Rate:</span>
                    <span class="metric-value status-{{ 'healthy' if cache_health.hit_rate_percent > 50 else 'warning' }}">
                        {{ cache_health.hit_rate_percent }}%
                    </span>
                </div>
                <div class="metric">
                    <span>Status:</span>
                    <span class="metric-value status-{{ cache_health.status }}">
                        {{ cache_health.status.title() }}
                    </span>
                </div>
            </div>
            
            <!-- Uptime Info -->
            <div class="stat-card">
                <div class="stat-title">⏱️ Uptime Info</div>
                <div class="metric">
                    <span>Uptime:</span>
                    <span class="metric-value">{{ uptime_formatted }}</span>
                </div>
                <div class="metric">
                    <span>Data Points:</span>
                    <span class="metric-value">{{ data_points }}</span>
                </div>
                <div class="metric">
                    <span>Monitoring:</span>
                    <span class="metric-value status-{{ 'healthy' if status == 'active' else 'warning' }}">
                        {{ status.title() }}
                    </span>
                </div>
            </div>
        </div>
        
        <div style="margin-top: 40px; text-align: center; color: #7f8c8d;">
            <p>TalentSphere Backend Performance Dashboard | Last updated: {{ current_time }}</p>
            <p>
                <a href="/api/performance" style="color: #3498db;">API Performance</a> | 
                <a href="/api/cache/stats" style="color: #3498db;">Cache Stats</a> | 
                <a href="/health" style="color: #3498db;">Health Check</a>
            </p>
        </div>
    </div>
    
    <script>
        // Auto-refresh every 30 seconds
        setTimeout(function() {
            location.reload();
        }, 30000);
    </script>
</body>
</html>
"""

def run_monitoring_server(port=5002):
    """Run standalone monitoring server"""
    monitoring_app = Flask(__name__)
    
    @monitoring_app.route('/health')
    def health():
        return jsonify({'status': 'healthy', 'service': 'performance-monitor'})
    
    @monitoring_app.route('/')
    def dashboard_view():
        try:
            dashboard_data = dashboard.get_dashboard_data()
            summary_stats = dashboard.get_summary_stats()
            
            # Combine data for template
            template_data = {
                **dashboard_data,
                **summary_stats,
                'current_time': datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
            }
            
            return render_template_string(DASHBOARD_TEMPLATE, **template_data)
        except Exception as e:
            return f"Dashboard error: {str(e)}", 500
    
    @monitoring_app.route('/api/data')
    def api_data():
        return jsonify(dashboard.get_dashboard_data())
    
    @monitoring_app.route('/api/summary')
    def api_summary():
        return jsonify(dashboard.get_summary_stats())
    
    print(f"🖥️  Starting Performance Dashboard on port {port}")
    print(f"📊 Dashboard URL: http://localhost:{port}")
    
    # Start monitoring
    dashboard.start_monitoring(interval=30)
    
    try:
        monitoring_app.run(host='0.0.0.0', port=port, debug=False)
    finally:
        dashboard.stop_monitoring()

if __name__ == '__main__':
    import sys
    port = int(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[1] == '--port' else 5002
    run_monitoring_server(port)
