# 🚀 Redis K6 Load Testing Optimization Guide

## 📊 Optimasi Dilakukan

### 1. **Ultra-Fast Caching Strategy**

#### Cache Configuration
```typescript
// Default TTL: 0 (unlimited)
// Manual invalidation saat mutation untuk kontrol penuh
CACHE_TTL = 0  // unlimited
```

#### Cache Key Pattern
```
http:cache:{userId}:{url}:{query}
```

**Contoh:**
- `http:cache:1:/api/users:{"isActive":"true"}`
- `http:cache:anon:/api/auth/me:{}`

### 2. **Performance Metrics**

#### Target Performance (Setelah Cache Warm-up):
- **Cache HIT**: < 1ms response time
- **Cache MISS**: First request fetch from DB (50-200ms)
- **Subsequent requests**: Instant dari Redis
- **Cache Invalidation**: Automatic on mutations

#### Monitoring di Logs:
```bash
# Cache HIT
⚡ CACHE HIT (0.8ms): /api/users

# Cache MISS
⏳ Cache MISS - Fetching from DB: /api/users
💾 CACHED (DB: 45ms, Total: 47ms): /api/users → TTL: unlimited
```

---

## 🧪 K6 Load Testing Setup

### Install K6
```bash
# Windows (chocolatey)
choco install k6

# Or download from: https://k6.io/docs/get-started/installation/
```

### Basic K6 Test Script

Create `k6-load-test.js`:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Warm-up: 10 users
    { duration: '1m', target: 50 },    // Load: 50 users  
    { duration: '2m', target: 100 },   // Peak: 100 users
    { duration: '1m', target: 50 },    // Scale down
    { duration: '30s', target: 0 },    // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<100'], // 95% requests < 100ms (dari cache!)
    http_req_failed: ['rate<0.01'],   // Error rate < 1%
  },
};

const BASE_URL = 'http://localhost:3006/api';

// Login untuk dapat token
export function setup() {
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    username: 'ahda.admin',
    password: 'Password123!',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  const token = loginRes.json('access_token');
  return { token };
}

export default function (data) {
  const params = {
    headers: {
      'Authorization': `Bearer ${data.token}`,
      'Content-Type': 'application/json',
    },
  };

  // Test 1: Get all users (should be CACHED!)
  const usersRes = http.get(`${BASE_URL}/users`, params);
  check(usersRes, {
    'users status 200': (r) => r.status === 200,
    'users fast (<50ms)': (r) => r.timings.duration < 50, // Cache should be <1ms!
  });

  // Test 2: Get user by ID
  const userRes = http.get(`${BASE_URL}/users/1`, params);
  check(userRes, {
    'user status 200': (r) => r.status === 200,
    'user fast (<50ms)': (r) => r.timings.duration < 50,
  });

  // Test 3: Get user stats
  const statsRes = http.get(`${BASE_URL}/users/stats`, params);
  check(statsRes, {
    'stats status 200': (r) => r.status === 200,
    'stats fast (<50ms)': (r) => r.timings.duration < 50,
  });

  // Test 4: Search users
  const searchRes = http.get(`${BASE_URL}/users/search?q=ahda`, params);
  check(searchRes, {
    'search status 200': (r) => r.status === 200,
    'search fast (<50ms)': (r) => r.timings.duration < 50,
  });

  sleep(0.1); // Small delay antara requests
}
```

### Run K6 Test

```bash
# Basic run
k6 run k6-load-test.js

# Run dengan output ke InfluxDB (optional)
k6 run --out influxdb=http://localhost:8086/k6 k6-load-test.js

# Run dengan custom VUs & duration
k6 run --vus 100 --duration 30s k6-load-test.js
```

---

## 📈 Expected Results

### First Run (Cache Cold Start)
```
✓ users status 200
✓ users fast (<50ms)................[Cache MISS: ~50-200ms]

First request akan hit database
Subsequent requests akan dari cache
```

### Second Run (Cache Warmed Up)
```
✓ users status 200
✓ users fast (<50ms)................[Cache HIT: <1ms] ⚡

Response time turun drastis!
95% requests < 5ms
99% requests < 10ms
```

### K6 Output Example
```
     ✓ users status 200
     ✓ users fast (<50ms)

     checks.........................: 100.00% ✓ 40000      ✗ 0
     data_received..................: 25 MB   418 kB/s
     data_sent......................: 12 MB   201 kB/s
     http_req_blocked...............: avg=1.2ms    p(95)=2.3ms
     http_req_duration..............: avg=2.1ms    p(95)=5.8ms  ⚡ FAST!
       { expected_response:true }...: avg=2.1ms    p(95)=5.8ms
     http_req_failed................: 0.00%   ✓ 0          ✗ 40000
     http_reqs......................: 40000   666.67/s
     iteration_duration.............: avg=150ms    p(95)=155ms
     iterations.....................: 10000   166.67/s
```

---

## 🔍 Monitoring Cache Performance

### 1. Check Logs
```bash
# Watch logs real-time
tail -f logs/combined.log | grep -E "CACHE (HIT|MISS)"

# Count cache hits vs misses
grep "CACHE HIT" logs/combined.log | wc -l
grep "CACHE MISS" logs/combined.log | wc -l
```

### 2. Redis CLI Monitoring
```bash
# Connect to Redis
redis-cli -h localhost -p 6379 -a gacorrr!@323

# Monitor real-time commands
MONITOR

# Check memory usage
INFO memory

# Count keys
DBSIZE

# Get cache keys
KEYS http:cache:*

# Get specific cache
GET "http:cache:1:/api/users:{}"
```

### 3. Check Cache Stats via Endpoint
```bash
# If you add /cache/stats endpoint
curl http://localhost:3006/api/cache/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎯 Cache Behavior Testing

### Test 1: Cache Warm-up
```bash
# Request 1 (Cache MISS)
curl http://localhost:3006/api/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -w "\nTime: %{time_total}s\n"

# Output: Time: 0.045s (45ms)
# Log: ⏳ Cache MISS - Fetching from DB

# Request 2 (Cache HIT)
curl http://localhost:3006/api/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -w "\nTime: %{time_total}s\n"

# Output: Time: 0.001s (1ms) ⚡
# Log: ⚡ CACHE HIT (0.8ms)
```

### Test 2: Cache Invalidation
```bash
# 1. Get users (Cache HIT)
curl http://localhost:3006/api/users -H "Authorization: Bearer YOUR_TOKEN"
# Log: ⚡ CACHE HIT

# 2. Update user (Cache INVALIDATION)
curl -X PATCH http://localhost:3006/api/users/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nama_lengkap": "Updated Name"}'
# Log: 🔄 Cache invalidated

# 3. Get users again (Cache MISS - fresh data!)
curl http://localhost:3006/api/users -H "Authorization: Bearer YOUR_TOKEN"
# Log: ⏳ Cache MISS - Fetching from DB
```

### Test 3: Different Filters = Different Cache
```bash
# Request 1: All users
curl http://localhost:3006/api/users
# Cache Key: http:cache:1:/api/users:{}

# Request 2: Active users only
curl "http://localhost:3006/api/users?isActive=true"
# Cache Key: http:cache:1:/api/users:{"isActive":"true"}

# Each combination has its own cache!
```

---

## ⚙️ Configuration Tips

### Adjust TTL per Endpoint (Optional)
```typescript
// In controller:
@CacheTTL(60000)  // 1 menit untuk data yang sering berubah
@Get('stats')
async getStats() {
  return this.userService.getUserStats();
}

@CacheTTL(0)  // Unlimited untuk data statis
@Get('by-role/:role')
async getUsersByRole(@Param('role') role: Role) {
  return this.userService.getUsersByRole(role);
}
```

### Skip Cache for Specific Endpoints
```typescript
@SkipCache()  // Decorator untuk skip cache
@Get('realtime-data')
async getRealtimeData() {
  return this.service.getRealtimeData();
}
```

---

## 🚀 Performance Tuning Checklist

- [x] Redis connection pooling optimized
- [x] Cache TTL set to unlimited (manual invalidation)
- [x] Cache key pattern per user/query
- [x] Automatic cache invalidation on mutations
- [x] Logging untuk monitoring cache behavior
- [x] Pipeline untuk batch Redis operations
- [x] MGET/MSET support
- [x] Fail-fast strategy (no retry delays)

---

## 📊 Benchmarking Commands

### Apache Bench (ab)
```bash
# 1000 requests, 10 concurrent
ab -n 1000 -c 10 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3006/api/users
```

### wrk
```bash
# 10 threads, 100 connections, 30 seconds
wrk -t10 -c100 -d30s \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3006/api/users
```

### autocannon (Node.js)
```bash
npm install -g autocannon

autocannon -c 100 -d 30 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3006/api/users
```

---

## 🎓 Best Practices

### 1. **Cache Warm-up Strategy**
- Jalankan warm-up script setelah deploy
- Pre-populate cache dengan data penting
- Monitor cache hit rate

### 2. **Cache Invalidation**
- Invalidate pattern saat mutation: `users:*`
- Clear user-specific cache: `http:cache:{userId}:*`
- Flush all cache di development only

### 3. **Monitoring**
- Track cache hit/miss ratio
- Monitor Redis memory usage
- Set alerts untuk cache errors

### 4. **K6 Testing**
- Start dengan warm-up stage
- Gradually increase load
- Monitor both app & Redis metrics

---

## 🔗 Resources

- [K6 Documentation](https://k6.io/docs/)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [NestJS Caching](https://docs.nestjs.com/techniques/caching)

---

## 📝 Next Steps

1. **Warm up cache** sebelum K6 testing
2. **Run basic K6 test** untuk baseline metrics
3. **Analyze results** dan adjust TTL jika perlu
4. **Run load test** dengan increasing VUs
5. **Monitor Redis** memory usage
6. **Optimize** based on bottlenecks

---

**Happy Load Testing! 🚀**

Target: **95% requests < 10ms** dari cache!
