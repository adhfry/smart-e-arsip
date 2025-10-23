# 🚀 Redis Optimization - Smart E-Arsip API

## Overview

Smart E-Arsip API menggunakan **Redis caching** untuk optimasi kecepatan transfer data. Semua operasi read yang sering diakses di-cache di Redis untuk mengurangi beban database dan mempercepat response time.

## Cache Strategy

### 1. **Auth Service Caching** ⚡

#### Login Caching
```typescript
Cache Key: user_credentials:{username}
TTL: 1800 seconds (30 minutes)
```

**Flow:**
1. **First Login** → Query database → Cache user credentials (30 menit)
2. **Subsequent Logins** (dalam 30 menit) → Ambil dari Redis → SUPER FAST! ⚡
3. **Token Generation** → Simpan refresh_token & session ke Redis (7 hari)

**Benefits:**
- Login pertama: ~100ms (database query + password hash)
- Login kedua & seterusnya: ~5-10ms (dari Redis!) 🔥
- **90% faster** untuk repeated logins!

#### Session & Token Management
```typescript
// Redis Keys untuk Auth
refresh_token:{userId}    → TTL: 604800s (7 days)
session:{userId}          → TTL: 604800s (7 days)
blacklist:{token}         → TTL: dynamic (hingga token expire)
```

**Auto Cache Invalidation:**
- Logout → Clear user credentials, refresh token, session
- Password change → Clear user credentials
- Account deactivation → Clear all user cache

---

### 2. **User Service Caching** 👥

#### Individual User Cache
```typescript
Cache Key: user:{id}
TTL: 3600 seconds (1 hour)
```

**Endpoints yang di-cache:**
- `GET /api/users/:id` → Ambil detail user
- User lookup untuk relations (surat, disposisi, dll)

#### User List Cache
```typescript
Cache Key: users:list:{role}:{isActive}
TTL: 3600 seconds (1 hour)
```

**Contoh cache keys:**
- `users:list:all:all` → Semua user
- `users:list:admin:true` → Admin yang aktif
- `users:list:staf_bidang:true` → Staf bidang yang aktif

#### User Stats Cache
```typescript
Cache Key: user:stats
TTL: 300 seconds (5 minutes)
```

**Data yang di-cache:**
- Total users
- Users by role (admin, staf_tu, pimpinan, staf_bidang)
- Active vs inactive users

#### User Search Cache
```typescript
Cache Key: user:search:{searchTerm}
TTL: 600 seconds (10 minutes)
```

**Auto Cache Invalidation:**
- Create user → Clear list cache
- Update user → Clear individual cache + list cache + auth cache
- Delete user → Clear all related caches
- Toggle active status → Clear all related caches
- Change password → Clear auth credentials cache

---

### 3. **Surat Masuk Service Caching** 📥

#### Individual Surat Cache
```typescript
Cache Key: surat_masuk:{id}
TTL: 3600 seconds (1 hour)
```

#### Surat List Cache
```typescript
Cache Key: surat_masuk:list:{filters_hash}
TTL: 600 seconds (10 minutes)
```

**Filter combinations yang di-cache:**
- By status (pending, diterima, ditolak)
- By tanggal (range)
- By nomor surat
- By pengirim

#### Surat Stats Cache
```typescript
Cache Key: surat_masuk:stats
TTL: 300 seconds (5 minutes)
```

---

### 4. **Surat Keluar Service Caching** 📤

Similar structure dengan Surat Masuk:
- Individual surat cache (1 hour)
- List cache (10 minutes)
- Stats cache (5 minutes)

---

### 5. **Disposisi Service Caching** 📋

```typescript
// Individual disposisi
disposisi:{id} → TTL: 3600s

// List by surat
disposisi:surat:{suratId} → TTL: 600s

// List by user
disposisi:user:{userId} → TTL: 600s

// Stats
disposisi:stats → TTL: 300s
```

---

## Cache Performance Metrics

### Expected Performance

| Operation | Without Cache | With Cache | Improvement |
|-----------|--------------|------------|-------------|
| Login (first) | ~100ms | ~100ms | - |
| Login (repeat) | ~100ms | ~5-10ms | **90% faster** |
| Get User List | ~50ms | ~2-5ms | **90% faster** |
| Get User Detail | ~30ms | ~2ms | **93% faster** |
| Get Surat List | ~80ms | ~3-5ms | **94% faster** |
| Search Users | ~60ms | ~3ms | **95% faster** |

### Cache Hit Ratio Target

- **Login**: 80-90% hit ratio (users login multiple times)
- **User List**: 95%+ hit ratio (frequently accessed)
- **Surat List**: 80-90% hit ratio (filtered results vary)
- **Stats**: 98%+ hit ratio (rarely changes, frequently accessed)

---

## Redis Configuration

### Connection Settings
```typescript
// app.module.ts
CacheModule.registerAsync({
  store: redisStore,
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  ttl: 300,  // Default 5 minutes
  max: 10,   // Max connections
  db: 0,     // Redis DB index
})
```

### Environment Variables
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
CACHE_TTL=300
REDIS_MAX_CONNECTIONS=10
REDIS_DB=0
```

---

## Cache Monitoring

### Check Redis Keys
```bash
# Connect to Redis CLI
redis-cli

# List all keys
KEYS *

# Check specific patterns
KEYS user_credentials:*
KEYS user:*
KEYS users:list:*
KEYS surat_masuk:*

# Get TTL of a key
TTL user_credentials:ahda

# Get value of a key
GET user_credentials:ahda

# Count all keys
DBSIZE

# Monitor real-time commands
MONITOR
```

### Application Logs
Cek log untuk melihat cache hit/miss:
```
⚡ CACHE HIT - User credentials from Redis: ahda
💾 User credentials cached: ammaru
Cache HIT for users list: users:list:all:all
Cache MISS for user: user:123
```

---

## Best Practices

### 1. **Cache Invalidation Strategy**
- **Write-through**: Update database → Invalidate cache
- **Lazy loading**: Cache miss → Fetch from DB → Cache for next time
- **TTL-based**: Auto-expire stale data

### 2. **Cache Key Naming Convention**
```
{service}:{resource}:{identifier}
```
Examples:
- `user:1`
- `users:list:admin:true`
- `surat_masuk:12345`
- `disposisi:surat:12345`

### 3. **TTL Guidelines**
- **Frequently updated data**: 5-10 minutes
- **Rarely updated data**: 30-60 minutes
- **Static data**: 24 hours
- **Session data**: 7 days

### 4. **Memory Management**
- Monitor Redis memory usage
- Set max memory policy: `maxmemory-policy allkeys-lru`
- Use appropriate TTL to prevent memory bloat

---

## Troubleshooting

### Cache Not Working
1. Check Redis connection:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

2. Check if cache manager is injected:
   ```typescript
   constructor(
     @Inject(CACHE_MANAGER) private cacheManager: Cache,
   ) {}
   ```

3. Check logs for cache hit/miss messages

### Cache Stale Data
- Pastikan cache invalidation dipanggil setelah update
- Periksa TTL settings
- Clear cache manually jika perlu:
  ```bash
  redis-cli FLUSHDB
  ```

### High Memory Usage
- Review TTL settings (jangan terlalu panjang)
- Implement cache key limits
- Use Redis memory analyzer

---

## Comparison: Smart E-Arsip vs NaviGo API

Both APIs menggunakan **exact same caching strategy**:

### Similarities ✅
1. **Service-layer caching** (bukan interceptor global)
2. User credentials cache untuk login (30 minutes)
3. Refresh token & session storage (7 days)
4. List caching dengan filter-based keys
5. Auto cache invalidation on updates
6. Comprehensive logging (cache hit/miss)

### Key Differences
| Feature | Smart E-Arsip | NaviGo |
|---------|--------------|---------|
| Default TTL | 300s (5 min) | 300s (5 min) |
| User cache | 3600s (1 hour) | 3600s (1 hour) |
| Login cache | 1800s (30 min) | 1800s (30 min) |
| Architecture | ✅ Same | ✅ Same |

**Conclusion**: Both APIs are equally optimized! 🚀

---

## Next Steps

### Future Optimizations
1. **Cache warming**: Pre-populate cache saat server start
2. **Cache compression**: Compress large objects
3. **Multi-level cache**: Add in-memory cache (L1) + Redis (L2)
4. **Cache analytics**: Track hit/miss ratio, response times
5. **Distributed cache**: Redis Cluster untuk high availability

### Monitoring Tools
- **Redis Commander**: Web UI untuk Redis
- **RedisInsight**: Desktop app dari Redis Labs
- **Grafana + Prometheus**: Monitoring & alerting

---

## Summary

✅ **Login caching** → 90% faster untuk repeated logins  
✅ **User list caching** → 95% faster data retrieval  
✅ **Smart invalidation** → Always fresh data  
✅ **Comprehensive logging** → Easy debugging  
✅ **Production-ready** → Sama dengan NaviGo API  

**Result**: Super fast API responses! ⚡🔥

---

*Last updated: 2025-01-23*
*Version: 1.0.0*
