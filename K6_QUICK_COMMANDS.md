# 🚀 K6 Load Testing - Quick Commands

## Prerequisites
```bash
# Install K6 (Windows with Chocolatey)
choco install k6

# Or download from https://k6.io/
```

## Step 1: Start Application
```bash
# Development
npm run start:dev

# Production
npm run build && npm run start:prod
```

## Step 2: Warm-up Cache (IMPORTANT!)
```bash
# Warm-up cache dengan data umum
k6 run k6-warmup.js

# Output akan menunjukkan cache yang di-populate
```

## Step 3: Run Load Test
```bash
# Basic load test (default: localhost:3006)
k6 run k6-load-test.js

# Custom API URL
k6 run k6-load-test.js -e API_URL=https://api.smart-e-arsip.agribunker.id

# With more verbose output
k6 run k6-load-test.js --verbose
```

## Step 4: Monitor Redis
```bash
# Terminal 1: Watch cache hits/misses
tail -f logs/combined.log | grep -E "CACHE (HIT|MISS)"

# Terminal 2: Monitor Redis
redis-cli -h localhost -p 6379 -a gacorrr!@323
> MONITOR

# Check memory
> INFO memory

# Count cached keys
> DBSIZE
```

## Quick Tests

### 1. Single Request Test
```bash
# Before cache warm-up (slow)
curl -w "\nTime: %{time_total}s\n" \
  http://localhost:3006/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
# Expected: ~50-100ms

# After cache warm-up (FAST!)
curl -w "\nTime: %{time_total}s\n" \
  http://localhost:3006/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
# Expected: <10ms ⚡
```

### 2. Apache Bench (Quick Alternative)
```bash
# 1000 requests, 10 concurrent
ab -n 1000 -c 10 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3006/api/users
```

### 3. wrk (Advanced)
```bash
# 10 threads, 100 connections, 30 seconds
wrk -t10 -c100 -d30s \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3006/api/users
```

## Expected Results

### After Warm-up
```
✓ [Users] Status 200............: 100.00%
✓ [Users] ULTRA fast (<10ms)....: 95.00%  ⚡⚡⚡
✓ cache_hits....................: >80%

http_req_duration...............: avg=3.2ms   p(95)=8.1ms  p(99)=15.3ms
http_req_duration{cached:true}..: avg=1.5ms   p(95)=4.2ms  p(99)=8.7ms ⚡
```

## Troubleshooting

### Redis Not Connected
```bash
# Check Redis status
redis-cli ping

# Start Redis (WSL)
sudo service redis-server start

# Check connection in app logs
grep "Redis connected" logs/combined.log
```

### Cache Not Working
```bash
# Check cache keys exist
redis-cli -a gacorrr!@323 KEYS "http:cache:*"

# Clear all cache and retry
redis-cli -a gacorrr!@323 FLUSHALL

# Restart app and warm-up again
npm run start:dev
k6 run k6-warmup.js
```

### High Response Times
```bash
# Check if cache is hit
tail -f logs/combined.log | grep "CACHE HIT"

# If all MISS:
# 1. Run warm-up script first
# 2. Check Redis is running
# 3. Check CACHE_TTL in .env
```

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Cache Hit Rate | >80% | After warm-up |
| p95 Response Time | <100ms | Overall |
| p95 Cached Response | <10ms | From Redis |
| p99 Response Time | <200ms | Overall |
| Error Rate | <1% | Success rate |
| Requests/sec | >500 | Sustained load |

## Cache Monitoring Commands

```bash
# Real-time cache statistics
redis-cli -a gacorrr!@323 INFO stats | grep -E "(hits|misses)"

# Watch cache size growth
watch -n 1 'redis-cli -a gacorrr!@323 DBSIZE'

# Check specific cache key
redis-cli -a gacorrr!@323 GET "http:cache:1:/api/users:{}"

# Count cache keys by pattern
redis-cli -a gacorrr!@323 KEYS "http:cache:*" | wc -l
```

## K6 Cloud (Optional)

```bash
# Sign up at k6.io/cloud
k6 login cloud

# Run test and stream to cloud
k6 run --out cloud k6-load-test.js

# View results: https://app.k6.io
```

---

**Happy Load Testing! 🚀**

Remember: 
1. **Always warm-up first!**
2. **Monitor Redis during tests**
3. **Check logs for cache behavior**
4. **Target: 95% requests < 10ms from cache!**
