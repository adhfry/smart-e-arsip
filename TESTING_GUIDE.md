# 🚀 Quick Testing Guide - User API dengan Redis Caching

## 📋 Prerequisites

1. ✅ Redis server berjalan (port 6379)
2. ✅ MySQL/MariaDB berjalan
3. ✅ Database sudah di-migrate
4. ✅ Environment variables configured

## 🎯 Testing Steps

### 1️⃣ Start Server

```bash
npm run start:dev
```

**Expected Output:**
```
╔══════════════════════════════════════════════════════════╗
║         🚀 Smart E-Arsip API - Server Started           ║
╠══════════════════════════════════════════════════════════╣
║  📡 Server URL:        http://localhost:3005            ║
║  📚 API Documentation: http://localhost:3005/api/docs   ║
║  ⚡ Redis Caching:     ENABLED                          ║
║  🔒 Security:          ENABLED (Helmet + CORS)          ║
╚══════════════════════════════════════════════════════════╝
```

---

### 2️⃣ Open Swagger UI

Navigate to: **http://localhost:3005/api/docs**

You should see:
- 👤 User Management section with 10 endpoints
- Each endpoint has detailed documentation
- Try it out buttons for testing

---

### 3️⃣ Login & Get Token

**POST** `/api/auth/login`

```json
{
  "username": "admin",
  "password": "your_password"
}
```

**Copy the access token** from response.

---

### 4️⃣ Authorize in Swagger

1. Click **"Authorize"** button (🔓 icon) at top right
2. Enter: `Bearer YOUR_ACCESS_TOKEN`
3. Click **"Authorize"**
4. Click **"Close"**

✅ Now you can test all endpoints!

---

## 🧪 Test Cache Behavior

### Test 1: GET User by ID (Cache MISS → HIT)

#### First Request (Cache MISS)
1. Go to `GET /users/{id}`
2. Click **"Try it out"**
3. Enter ID: `1`
4. Click **"Execute"**
5. **Check response time**: ~50-100ms
6. **Check server logs**:
   ```
   [UserService] Cache MISS for user:1
   [UserService] Cached user: user:1
   ```

#### Second Request (Cache HIT)
1. Click **"Execute"** again
2. **Check response time**: ~5-10ms ⚡ **Much faster!**
3. **Check server logs**:
   ```
   [UserService] Cache HIT for user:1
   [CacheMonitor] ⚡ FAST RESPONSE: GET /api/users/1 - 7ms
   ```

✅ **Cache Working!** Response 10x lebih cepat!

---

### Test 2: GET All Users (Different Filters = Different Cache)

#### Request 1: All Users
```
GET /users
```
**Cache Key:** `users:list:all:all`

Check logs:
```
[UserService] Cache MISS for users list: users:list:all:all
[UserService] Cached users list: users:list:all:all
```

#### Request 2: Only Admins
```
GET /users?role=admin
```
**Cache Key:** `users:list:admin:all`

Check logs:
```
[UserService] Cache MISS for users list: users:list:admin:all
[UserService] Cached users list: users:list:admin:all
```

#### Request 3: Active Staf TU
```
GET /users?role=staf_tu&isActive=true
```
**Cache Key:** `users:list:staf_tu:true`

**Repeat same requests** → Should see Cache HIT! ⚡

---

### Test 3: Cache Invalidation

#### Step 1: GET User (Cache it)
```
GET /users/1
```
Check logs: **Cache MISS** → Data cached

#### Step 2: GET Again (From cache)
```
GET /users/1
```
Check logs: **Cache HIT** ✅

#### Step 3: UPDATE User (Invalidate cache)
```
PATCH /users/1
{
  "nama_lengkap": "Updated Name"
}
```
Check logs:
```
[UserService] Invalidated cache: user:1
[UserService] User updated: Updated Name (ID: 1)
```

#### Step 4: GET Again (Fresh from DB)
```
GET /users/1
```
Check logs: **Cache MISS** (cache was invalidated) → Fresh data cached

✅ **Cache Invalidation Working!**

---

### Test 4: User Statistics (Fast Cache)

#### First Request
```
GET /users/stats
```
- Response time: ~100-150ms
- Logs: Cache MISS

#### Second Request (Within 5 minutes)
```
GET /users/stats
```
- Response time: ~5-8ms ⚡
- Logs: Cache HIT

**Note:** Stats cache expires after 5 minutes (shorter TTL)

---

### Test 5: Search Users (Cached Results)

#### Search "ahmad"
```
GET /users/search?q=ahmad
```
- First request: Cache MISS
- Second request: Cache HIT ⚡

#### Search "siti"
```
GET /users/search?q=siti
```
- Different search term = Different cache key
- First request: Cache MISS

**Each search term has its own cache!**

---

## 📊 Monitoring Cache in Real-Time

### Terminal 1: Server Logs
```bash
npm run start:dev
```

### Terminal 2: Watch Logs File
```bash
tail -f logs/combined.log | grep -E "Cache|UserService"
```

### Terminal 3: Redis CLI
```bash
redis-cli

# View all user cache keys
KEYS user:*

# View all list cache keys
KEYS users:list:*

# Get cached user data
GET user:1

# Check TTL
TTL user:1
```

---

## 🎨 Visual Response Time Comparison

### Without Cache (First Request)
```
Request → Database Query (50-100ms) → Response
         [========================================] 100ms
```

### With Cache (Second Request)
```
Request → Redis Cache (5-10ms) → Response
         [====] 10ms
```

**10x faster!** ⚡

---

## 📈 Performance Testing Script

### Create test script: `test-cache.sh`

```bash
#!/bin/bash

TOKEN="YOUR_JWT_TOKEN"
BASE_URL="http://localhost:3005/api"

echo "🧪 Testing Cache Performance..."
echo ""

echo "1️⃣ First Request (Cache MISS)..."
time curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/users/1" > /dev/null
echo ""

echo "2️⃣ Second Request (Cache HIT)..."
time curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/users/1" > /dev/null
echo ""

echo "3️⃣ Third Request (Cache HIT)..."
time curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/users/1" > /dev/null
echo ""

echo "✅ Check server logs to verify cache HIT/MISS!"
```

### Run:
```bash
chmod +x test-cache.sh
./test-cache.sh
```

---

## 🎯 Expected Results Checklist

### ✅ Cache HIT Indicators:
- [ ] Response time < 10ms
- [ ] Logs show "Cache HIT for user:X"
- [ ] Second request much faster than first
- [ ] Data is consistent

### ✅ Cache MISS Indicators:
- [ ] Response time > 50ms
- [ ] Logs show "Cache MISS for user:X"
- [ ] Logs show "Cached user: user:X"
- [ ] First request after invalidation

### ✅ Cache Invalidation:
- [ ] Update triggers cache clear
- [ ] Next request is Cache MISS
- [ ] Fresh data returned
- [ ] New data cached

---

## 🔍 Troubleshooting

### Problem: Always Cache MISS

**Check:**
```bash
# Is Redis running?
redis-cli ping
# Should return: PONG

# Check Redis connection in app
redis-cli CLIENT LIST | grep nest
```

### Problem: Cache Not Invalidating

**Check:**
```bash
# View cache keys
redis-cli KEYS "user:*"

# Manually delete if needed
redis-cli DEL user:1
```

### Problem: Slow Response Even with Cache

**Check:**
```bash
# Redis memory usage
redis-cli INFO memory

# Network latency
redis-cli --latency
```

---

## 📚 Additional Testing

### Test User CRUD Flow

1. **CREATE** user → List cache invalidated
2. **GET** user → Data cached
3. **UPDATE** user → Individual + list cache invalidated
4. **GET** user → Fresh data cached
5. **DELETE** user → All caches invalidated

### Test Different Roles

1. Login as **Admin** → Test all endpoints
2. Login as **Staf TU** → Test read operations
3. Login as **Pimpinan** → Test read operations
4. Verify authorization works

---

## 🎉 Success Criteria

✅ **All 10 endpoints** work correctly
✅ **Cache HIT** on repeated GET requests
✅ **Cache MISS** on first request
✅ **Cache invalidation** on updates
✅ **Response time** < 10ms for cached data
✅ **Logs** show cache behavior clearly
✅ **Swagger docs** display correctly
✅ **Authorization** works as expected

---

## 💡 Pro Tips

### 1. Monitor in Browser DevTools
- Open Network tab
- Compare timing for same request
- First: ~100ms, Second: ~10ms

### 2. Use Swagger Response Time
- Swagger shows "Duration" at bottom of response
- Compare durations between requests

### 3. Check Redis Directly
```bash
# Watch Redis in real-time
redis-cli MONITOR
```

### 4. Log Filtering
```bash
# Only cache logs
tail -f logs/combined.log | grep "Cache"

# Only user service logs
tail -f logs/combined.log | grep "UserService"

# Both
tail -f logs/combined.log | grep -E "Cache|UserService"
```

---

## 🚀 Ready to Test!

1. Start server: `npm run start:dev`
2. Open: http://localhost:3005/api/docs
3. Login & authorize
4. Test endpoints
5. Watch logs for cache HIT/MISS
6. Verify response times
7. Celebrate! 🎉

**Happy Testing!** ⚡
