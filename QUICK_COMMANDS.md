# 🚀 Quick Commands Reference

## Development

```bash
# Start development server with hot reload
npm run start:dev

# Build for production
npm run build

# Run production build
npm run start:prod
```

## Testing Cache

```bash
# Terminal 1: Start server
npm run start:dev

# Terminal 2: Watch cache logs
tail -f logs/combined.log | grep -E "Cache|UserService"

# Terminal 3: Monitor Redis
redis-cli MONITOR
```

## Swagger UI

```
http://localhost:3006/api/docs
```

## Redis Commands

```bash
# Check Redis connection
redis-cli ping

# View all user cache keys
redis-cli KEYS "user:*"

# View all list cache keys
redis-cli KEYS "users:list:*"

# Get cached data
redis-cli GET user:1

# Check TTL
redis-cli TTL user:1

# Clear all cache (use with caution!)
redis-cli FLUSHDB

# Monitor Redis in real-time
redis-cli MONITOR
```

## Database Commands

```bash
# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Open Prisma Studio
npx prisma studio

# Seed database
npx prisma db seed
```

## cURL Testing Examples

```bash
# Replace YOUR_TOKEN with actual JWT token

# Get all users
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3006/api/users

# Get user by ID
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3006/api/users/1

# Get user statistics
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3006/api/users/stats

# Search users
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3006/api/users/search?q=ahmad"

# Create user
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nama_lengkap": "Test User",
    "username": "test.user",
    "email": "test@example.com",
    "phone": "081234567890",
    "password": "Password123!",
    "role": "staf_tu"
  }' \
  http://localhost:3006/api/users

# Update user
curl -X PATCH \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nama_lengkap": "Updated Name"}' \
  http://localhost:3006/api/users/1

# Change password
curl -X PATCH \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "Password123!",
    "newPassword": "NewPassword456!"
  }' \
  http://localhost:3006/api/users/1/change-password

# Toggle active status
curl -X PATCH \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3006/api/users/1/toggle-active

# Delete user
curl -X DELETE \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3006/api/users/1
```

## Performance Testing

```bash
# Test response time (first request - cache miss)
time curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3006/api/users/1

# Test response time (second request - cache hit)
time curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3006/api/users/1

# Compare the times - second should be ~10x faster!
```

## Log Monitoring

```bash
# Watch all logs
tail -f logs/combined.log

# Watch only cache logs
tail -f logs/combined.log | grep Cache

# Watch only user service logs
tail -f logs/combined.log | grep UserService

# Watch cache HIT/MISS
tail -f logs/combined.log | grep -E "Cache (HIT|MISS)"

# Watch errors
tail -f logs/error.log
```

## Docker Commands (if using Docker)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Restart API
docker-compose restart api

# Stop all services
docker-compose down

# Rebuild API
docker-compose up -d --build api

# Execute commands in API container
docker-compose exec api npm run prisma migrate dev

# Redis CLI in container
docker-compose exec redis redis-cli
```

## Troubleshooting

```bash
# Check if Redis is running
redis-cli ping
# Expected: PONG

# Check Redis connection from app
redis-cli CLIENT LIST | grep nest

# Check database connection
npx prisma db pull

# Clear Node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build and rebuild
rm -rf dist
npm run build

# Check port availability
netstat -ano | findstr :3005
netstat -ano | findstr :6379
```

## Environment Variables Check

```bash
# Display current environment
cat .env | grep -E "DATABASE_URL|REDIS_HOST|REDIS_PORT|APP_PORT"
```

## Health Checks

```bash
# API health
curl http://localhost:3006/api/health

# Redis health
redis-cli ping

# Database health
npx prisma db execute --stdin < "SELECT 1"
```

## Cache Statistics

```bash
# Redis info
redis-cli INFO stats

# Memory usage
redis-cli INFO memory

# Connected clients
redis-cli CLIENT LIST

# Keys count
redis-cli DBSIZE

# Slowlog (find slow queries)
redis-cli SLOWLOG GET 10
```

## Quick Test Script

Save as `test.sh`:

```bash
#!/bin/bash
TOKEN="your_jwt_token_here"
BASE="http://localhost:3006/api"

echo "Testing User API with Cache..."
echo ""
echo "1. First GET (Cache MISS):"
time curl -s -H "Authorization: Bearer $TOKEN" "$BASE/users/1" | jq -r '.username'

echo ""
echo "2. Second GET (Cache HIT - should be faster!):"
time curl -s -H "Authorization: Bearer $TOKEN" "$BASE/users/1" | jq -r '.username'

echo ""
echo "Check logs for Cache HIT/MISS messages!"
```

Make executable: `chmod +x test.sh`
Run: `./test.sh`

## Common Issues & Solutions

### Issue: Cache always MISS
```bash
# Check Redis connection
redis-cli ping

# Check if keys are being created
redis-cli KEYS "*"

# Check app logs
tail -f logs/combined.log | grep Redis
```

### Issue: Slow response even with cache
```bash
# Check Redis latency
redis-cli --latency

# Check network
ping localhost

# Check Redis memory
redis-cli INFO memory
```

### Issue: Build errors
```bash
# Clear and reinstall
rm -rf node_modules dist
npm install
npm run build
```

## Documentation Quick Links

- Swagger UI: http://localhost:3006/api/docs
- USER_API_CACHE.md - Complete API documentation
- TESTING_GUIDE.md - Testing instructions
- IMPLEMENTATION_COMPLETE.md - Implementation summary

## Pro Tips

1. **Always check logs** when testing cache:
   ```bash
   tail -f logs/combined.log | grep Cache
   ```

2. **Use Swagger UI** for interactive testing - easiest way!

3. **Monitor Redis** in real-time to see keys being created:
   ```bash
   redis-cli MONITOR
   ```

4. **Compare response times** - cache should be ~10x faster

5. **Clear specific cache** if needed:
   ```bash
   redis-cli DEL user:1
   redis-cli DEL "users:list:all:all"
   ```

6. **Check cache hit ratio** in Redis:
   ```bash
   redis-cli INFO stats | grep keyspace
   ```

---

**Happy coding!** 🚀
