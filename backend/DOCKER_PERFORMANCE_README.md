# TalentSphere Backend - Docker & Performance Setup

## 🚀 Quick Start

### Development Setup
```bash
# Clone and setup
git clone <repository-url>
cd TalentSphere/backend

# Build and run with Docker
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Or run locally with optimization
./build.sh
./start.sh
```

### Production Setup
```bash
# Set environment variables
cp .env.example .env  # Edit with your values

# Build and run production
docker-compose up --build -d

# Or run locally
./build.sh
./start_optimized.sh
```

## 🐳 Docker Configuration

### Services

#### Backend (TalentSphere API)
- **Port**: 5001 (configurable via `PORT` env var)
- **Performance**: Optimized with connection pooling, caching, and indexes
- **Health Check**: `/api/health` endpoint
- **Auto-restart**: Unless manually stopped

#### Redis Cache
- **Port**: 6379
- **Purpose**: API response caching, session storage
- **Memory Limit**: 256MB with LRU eviction
- **Persistence**: Append-only file enabled

### Environment Variables

#### Required
```bash
DATABASE_URL=postgresql://user:pass@host:port/db
SECRET_KEY=your-secret-key-here
```

#### Optional (Performance)
```bash
# Caching
REDIS_URL=redis://redis:6379/0

# Database Performance
SLOW_QUERY_THRESHOLD=1.0
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20
DB_POOL_TIMEOUT=30
DB_POOL_RECYCLE=3600

# Application
FLASK_ENV=production
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

## 📋 Available Commands

### Docker Commands
```bash
# Development (with hot reload)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Production
docker-compose up -d

# View logs
docker-compose logs -f backend

# Performance monitoring
docker-compose --profile monitoring up monitoring

# Stop all services
docker-compose down

# Rebuild after changes
docker-compose up --build
```

### Local Development
```bash
# Setup and optimize
./build.sh

# Start development server
./start.sh

# Start optimized server
./start_optimized.sh

# Run performance monitoring
python monitor_performance.py

# Run full optimization
./optimize_backend.sh
```

## 🔧 Performance Features

### Database Optimizations
- **38 Strategic Indexes**: Optimized for common queries
- **Connection Pooling**: Efficient database connections
- **Query Monitoring**: Slow query detection and logging
- **Full-text Search**: PostgreSQL GIN indexes for fast search

### Caching System
- **Redis Integration**: Automatic API response caching
- **Smart Invalidation**: Cache updates when data changes
- **Fallback Support**: Graceful degradation if Redis unavailable
- **Configurable TTL**: Different cache durations per data type

### Application Performance
- **Optimized Gunicorn**: Multi-worker production configuration
- **Memory Management**: Worker memory limits and recycling
- **Health Monitoring**: Built-in health checks and metrics
- **Resource Optimization**: CPU and memory usage optimization

## 📊 Monitoring

### Health Checks
- **Backend Health**: `GET /api/health`
- **Database Status**: Connection and query performance
- **Cache Status**: Redis connectivity and hit rates

### Performance Monitoring
```bash
# Real-time monitoring
docker-compose logs -f backend

# Performance metrics
docker exec backend python monitor_performance.py

# Database performance
docker exec backend python -c "from src.utils.db_optimization import get_performance_stats; print(get_performance_stats())"
```

### Metrics Available
- System resources (CPU, memory, disk)
- Database connection pool status
- Slow query tracking
- Cache hit/miss rates
- Response time statistics

## 🔒 Security Configuration

### Production Security
```bash
# Environment variables
FLASK_ENV=production
SQL_ECHO=false
DEBUG=false

# Database
DATABASE_URL=postgresql://secure-connection-string

# Secrets (use strong random values)
SECRET_KEY=very-long-random-secret-key
JWT_SECRET_KEY=another-long-random-key
```

### Network Security
- Internal network for service communication
- No direct database exposure
- Redis protected within Docker network
- Health check endpoints only on localhost

## 🚀 Deployment Options

### Render.com
```bash
# Build Command
pip install -r requirements.txt && python optimize_database.py

# Start Command  
./start_optimized.sh

# Environment Variables
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
FLASK_ENV=production
```

### Heroku
```bash
# Procfile
web: ./start_optimized.sh

# Add Redis addon
heroku addons:create heroku-redis:mini
```

### VPS/Self-hosted
```bash
# Using Docker Compose
docker-compose up -d

# Or with reverse proxy (nginx)
# See nginx configuration in docs/
```

## 🛠️ Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check database URL
docker-compose exec backend python -c "import os; print(os.getenv('DATABASE_URL'))"

# Test connection
docker-compose exec backend python test_db_connection.py
```

#### Redis Connection
```bash
# Check Redis status
docker-compose exec redis redis-cli ping

# Test from backend
docker-compose exec backend python -c "import redis; r=redis.from_url('redis://redis:6379/0'); print(r.ping())"
```

#### Performance Issues
```bash
# Check slow queries
docker-compose exec backend python monitor_performance.py

# Database optimization
docker-compose exec backend python optimize_database.py
```

### Log Analysis
```bash
# Backend logs
docker-compose logs backend | grep -E "(ERROR|Slow query)"

# Redis logs
docker-compose logs redis

# All services
docker-compose logs -f
```

## 📈 Performance Benchmarks

### Expected Improvements
- **Database Queries**: 70-90% faster with indexes
- **API Response Times**: 50-80% improvement with caching
- **Concurrent Users**: 3-5x better handling with connection pooling
- **Memory Usage**: 30-50% more efficient with optimizations

### Load Testing
```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test API endpoint
ab -n 1000 -c 10 http://localhost:5001/api/health

# Test with authentication
ab -n 100 -c 5 -H "Authorization: Bearer <token>" http://localhost:5001/api/jobs
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch with performance tests
3. Update documentation for any new optimizations
4. Submit pull request with performance impact analysis

## 📚 Additional Resources

- [Database Optimization Guide](docs/database-optimization.md)
- [Caching Strategy Documentation](docs/caching-strategy.md)
- [Production Deployment Guide](docs/production-deployment.md)
- [Performance Monitoring Setup](docs/monitoring-setup.md)
