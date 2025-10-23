# Redis Connection Guide

## Install Redis CLI di Windows

### Option 1: Via Chocolatey
```powershell
choco install redis-cli
```

### Option 2: Download Manual
Download dari: https://github.com/microsoftarchive/redis/releases

## Connect ke Redis

### Connect ke Redis di Docker
```powershell
# Connect ke Redis container
docker exec -it smart-arsip-redis redis-cli -a redis_password_change_this

# Atau langsung dari PowerShell
redis-cli -h localhost -p 6379 -a redis_password_change_this
```

### Redis Commands

```bash
# Test connection
PING

# Get all keys
KEYS *

# Get specific key
GET key_name

# Set key
SET key_name value

# Delete key
DEL key_name

# Clear all cache
FLUSHALL

# Get info
INFO

# Monitor real-time commands
MONITOR

# Exit
exit
```

## Connect dari NestJS App

```typescript
// Di .env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password_change_this

// Connection otomatis via app
```
