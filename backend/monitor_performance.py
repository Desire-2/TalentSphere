#!/usr/bin/env python3
"""
TalentSphere Backend Performance Monitor

Monitors database performance, slow queries, and system metrics.
"""

import os
import sys
import time
import psutil
from datetime import datetime

# Add backend path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def monitor_performance():
    """Monitor system and database performance"""
    try:
        from src.utils.db_optimization import get_performance_stats
        from src.utils.cache import cache
        
        print("=" * 60)
        print(f"TalentSphere Performance Monitor - {datetime.now()}")
        print("=" * 60)
        
        # System metrics
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        print(f"\n📊 System Metrics:")
        print(f"CPU Usage: {cpu_percent}%")
        print(f"Memory Usage: {memory.percent}% ({memory.used // 1024 // 1024}MB / {memory.total // 1024 // 1024}MB)")
        print(f"Disk Usage: {disk.percent}% ({disk.used // 1024 // 1024 // 1024}GB / {disk.total // 1024 // 1024 // 1024}GB)")
        
        # Database performance
        db_stats = get_performance_stats()
        
        print(f"\n🗄️  Database Metrics:")
        print(f"Slow Queries: {db_stats['slow_queries_count']}")
        print(f"Connection Pool:")
        pool_status = db_stats['pool_status']
        print(f"  - Pool Size: {pool_status['pool_size']}")
        print(f"  - Checked In: {pool_status['checked_in']}")
        print(f"  - Checked Out: {pool_status['checked_out']}")
        print(f"  - Overflow: {pool_status['overflow']}")
        print(f"  - Invalid: {pool_status['invalid']}")
        
        # Cache status
        if cache.enabled:
            print(f"\n⚡ Cache Status: Enabled (Redis)")
        else:
            print(f"\n⚡ Cache Status: Disabled")
        
        # Recent slow queries
        if db_stats['recent_slow_queries']:
            print(f"\n🐌 Recent Slow Queries:")
            for i, query in enumerate(db_stats['recent_slow_queries'][-5:], 1):
                duration = query.get('duration', 0)
                sql = query.get('query', '')[:100] + '...' if len(query.get('query', '')) > 100 else query.get('query', '')
                print(f"  {i}. {duration:.3f}s - {sql}")
        
        print(f"\n" + "=" * 60)
        
    except Exception as e:
        print(f"❌ Performance monitoring failed: {str(e)}")

if __name__ == '__main__':
    monitor_performance()
