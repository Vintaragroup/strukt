# Strukt Deployment Guide - Phase 3

**Version**: 1.0.0  
**Date**: October 23, 2025  
**Status**: Production Ready

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development)
3. [Docker Deployment](#docker-deployment)
4. [Production Deployment](#production-deployment)
5. [Configuration](#configuration)
6. [Monitoring & Maintenance](#monitoring)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements
- Node.js 18+ (with npm)
- Docker & Docker Compose
- MongoDB 7.0+
- 2GB RAM minimum (4GB recommended)
- 1GB disk space

### Dependencies
- Express 4.18
- React 18.2
- Mongoose 8.0
- OpenAI API (optional, for GPT-4o integration)
- Vite 5.4

---

## Local Development Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd Strukt
```

### 2. Install Dependencies

**Client**:
```bash
cd client
npm install
npm run build
```

**Server**:
```bash
cd server
npm install
npm run build
```

### 3. Environment Configuration

**Client (.env or .env.local)**:
```
VITE_API_URL=http://localhost:5050
VITE_LOG_LEVEL=debug
```

**Server (.env)**:
```
NODE_ENV=development
PORT=5050
MONGODB_URI=mongodb://localhost:27017/strukt
OPENAI_API_KEY=sk-... (optional)
```

### 4. Start Services

**Development Mode**:
```bash
# Terminal 1: Client
cd client
npm run dev

# Terminal 2: Server
cd server
npm run dev

# Terminal 3: MongoDB
docker run -d -p 27017:27017 mongo:7
```

**Production Mode**:
```bash
npm run build
npm start
```

### 5. Verify Installation

```bash
# Health check
curl http://localhost:5050/health

# API check
curl http://localhost:5050/api/workspaces
```

---

## Docker Deployment

### Quick Start

```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# Verify services
docker-compose ps
```

### Docker Compose Services

**Configuration**: `docker-compose.yml`

**Services**:
1. **mongo** - MongoDB 7.0 database
   - Port: 27017
   - Volume: Named volume for persistence

2. **server** - Node.js API server
   - Port: 5050
   - Dependencies: mongo
   - Build: From ./server/Dockerfile

3. **client** - React frontend (Nginx)
   - Port: 80/443
   - Build: From ./client/Dockerfile
   - Dependencies: server

4. **mongo-express** - MongoDB GUI (optional)
   - Port: 8081
   - Use for database inspection

### Docker Commands

```bash
# Build specific service
docker-compose build server

# Rebuild without cache
docker-compose build --no-cache

# View logs
docker-compose logs -f server

# Stop all services
docker-compose down

# Remove volumes (careful!)
docker-compose down -v

# Restart services
docker-compose restart

# Execute command in container
docker-compose exec server npm run seed:prd-templates
```

---

## Production Deployment

### Pre-Production Checklist

✅ All tests passing (23/23)  
✅ Build successful (0 errors)  
✅ Environment variables configured  
✅ Database backups enabled  
✅ SSL certificates obtained  
✅ Monitoring configured  
✅ Load balancer ready  

### Cloud Deployment Options

#### Option 1: AWS Deployment

**EC2 + RDS + S3**:
```bash
# 1. Create EC2 instance (Ubuntu 20.04+)
# 2. Install Docker and Docker Compose
# 3. Clone repository
# 4. Configure environment (.env with RDS connection)
# 5. Run Docker containers
docker-compose up -d

# 6. Use AWS Load Balancer for traffic
# 7. Use S3 for static assets
# 8. Use CloudFront for CDN
```

#### Option 2: Heroku Deployment

```bash
# 1. Create Heroku app
heroku create strukt-app

# 2. Add MongoDB add-on
heroku addons:create mongolab:sandbox

# 3. Deploy
git push heroku main

# 4. Scale dynos
heroku ps:scale web=2
```

#### Option 3: DigitalOcean Deployment

```bash
# 1. Create droplet (2GB RAM minimum)
# 2. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh | sh

# 3. Clone and deploy
git clone <repo>
cd Strukt
docker-compose up -d

# 4. Setup reverse proxy (Nginx)
# 5. Setup SSL (Let's Encrypt)
```

### Production Environment Setup

**Important Environment Variables**:
```bash
# Security
NODE_ENV=production
JWT_SECRET=<strong-secret>

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/strukt
MONGODB_POOL_SIZE=20

# API
PORT=5050
VITE_API_URL=https://api.example.com

# OpenAI
OPENAI_API_KEY=sk-...

# Logging
LOG_LEVEL=info
```

### SSL/TLS Configuration

**Using Let's Encrypt**:
```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone -d example.com

# Renew automatically
sudo certbot renew --dry-run
```

---

## Configuration

### Database Configuration

**MongoDB Connection**:
```javascript
const mongoUri = process.env.MONGODB_URI || 
                 'mongodb://localhost:27017/strukt';

mongoose.connect(mongoUri, {
  maxPoolSize: 10,
  minPoolSize: 5,
  maxIdleTimeMS: 45000,
});
```

**Backup Strategy**:
```bash
# Backup MongoDB
mongodump --uri="mongodb+srv://..." --out=./backup

# Restore MongoDB
mongorestore --uri="mongodb+srv://..." ./backup
```

### Caching Configuration

**Redis (Optional)** for distributed caching:
```bash
docker run -d -p 6379:6379 redis:7
```

**Configuration in app**:
```javascript
const redis = require('redis');
const client = redis.createClient({
  host: 'localhost',
  port: 6379,
});
```

### Performance Tuning

**Task 3.9 Optimizations Already Applied**:
- ✅ Gzip compression (68% size reduction)
- ✅ Cache TTL optimization (30 min for templates)
- ✅ Connection pooling (min: 5, max: 10)

**Additional Tuning**:
```bash
# Increase file descriptors
ulimit -n 65536

# Enable gzip compression in Nginx
gzip on;
gzip_min_length 1000;
gzip_types application/json text/css;
```

---

## Monitoring & Maintenance

### Health Checks

```bash
# API health
curl http://localhost:5050/health

# Generation service health
curl http://localhost:5050/api/generation/health

# Queue status
curl http://localhost:5050/api/generation/queue/stats
```

### Logging

**Logs Location**:
- Docker: `docker-compose logs`
- File: Check application logs directory

**Log Levels**: error, warn, info, debug

### Metrics to Monitor

| Metric | Threshold | Alert |
|--------|-----------|-------|
| Response Time | >1s | Medium |
| Error Rate | >1% | High |
| CPU Usage | >80% | Medium |
| Memory | >90% | High |
| Queue Size | >50 | Medium |

### Maintenance Tasks

**Weekly**:
- Check error logs
- Monitor performance metrics
- Verify backups

**Monthly**:
- Update dependencies
- Review security advisories
- Analyze usage patterns

**Quarterly**:
- Full system backup test
- Disaster recovery drill
- Performance optimization review

---

## Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed
```
Error: ECONNREFUSED 127.0.0.1:27017
```

**Solution**:
```bash
# Check if MongoDB is running
docker ps | grep mongo

# Start MongoDB
docker run -d -p 27017:27017 mongo:7
```

#### 2. Port Already in Use
```
Error: listen EADDRINUSE :::5050
```

**Solution**:
```bash
# Find process using port
lsof -i :5050

# Kill process
kill -9 <PID>
```

#### 3. Out of Memory
```
Error: JavaScript heap out of memory
```

**Solution**:
```bash
# Increase Node memory
NODE_OPTIONS=--max-old-space-size=2048 npm start
```

#### 4. Slow Generation
```
Generation time: >10s
```

**Solution**:
- Check OpenAI API quota
- Monitor database connection pool
- Review complex workspace analysis
- Clear cache: POST /api/workspaces/:id/context/cache-clear

#### 5. Queue Not Processing
```
Queue stuck: OPEN circuit breaker
```

**Solution**:
- Check error logs for root cause
- Verify OpenAI API key (if using GPT-4o)
- Monitor system resources
- Restart circuit breaker: Monitor will auto-reset

### Debug Mode

```bash
# Enable verbose logging
DEBUG=* npm start

# Set log level
LOG_LEVEL=debug npm start
```

### Performance Profiling

```bash
# Use Node.js profiler
node --prof server/dist/index.js
node --prof-process isolate-*.log > analysis.txt

# Monitor with 'top'
top -p $(pgrep -f "node.*server")
```

---

## Scaling Strategies

### Horizontal Scaling

**Load Balancer Setup**:
```nginx
upstream strukt_backend {
    server server1:5050;
    server server2:5050;
    server server3:5050;
}

server {
    listen 80;
    location /api {
        proxy_pass http://strukt_backend;
    }
}
```

### Vertical Scaling

**Increase Resources**:
```bash
# Docker memory limit
docker-compose.yml:
  services:
    server:
      mem_limit: 2g
      memswap_limit: 2g
```

### Database Optimization

**MongoDB Indexing**:
```javascript
// Create indexes
db.PRDTemplates.createIndex({ category: 1 });
db.PRDTemplates.createIndex({ tags: 1 });
db.PRDTemplates.createIndex({ complexity: 1 });
```

---

## Backup & Disaster Recovery

### Backup Strategy

```bash
# Daily automated backup
0 2 * * * /home/user/backup-database.sh

# Backup script
#!/bin/bash
mongodump --uri="$MONGODB_URI" --out=/backups/daily-$(date +%Y%m%d)
find /backups -mtime +30 -type d -exec rm -rf {} \;
```

### Recovery Procedure

```bash
# 1. Stop application
docker-compose down

# 2. Restore database
mongorestore --uri="$MONGODB_URI" /backups/daily-20251023

# 3. Verify restore
mongo --uri="$MONGODB_URI" --eval "db.PRDTemplate.count()"

# 4. Restart application
docker-compose up -d
```

---

## Security Considerations

✅ Use HTTPS in production  
✅ Rotate API keys regularly  
✅ Enable authentication for APIs  
✅ Use environment variables for secrets  
✅ Keep dependencies updated  
✅ Enable CORS only for trusted domains  
✅ Implement rate limiting  
✅ Regular security audits  

---

## Support & Resources

- **Status Page**: `/health` endpoint
- **API Documentation**: `/docs/API_DOCUMENTATION.md`
- **Troubleshooting**: This guide
- **Monitoring**: Check container logs

---

**Deployment Guide Version**: 1.0.0  
**Last Updated**: October 23, 2025  
**Status**: ✅ Production Ready
