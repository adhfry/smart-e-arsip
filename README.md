# Smart E-Arsip API

API Backend untuk sistem arsip elektronik dengan **Redis Caching** untuk performa optimal menggunakan NestJS, MySQL, dan Redis.

## ✨ Features

- ⚡ **Redis Caching** - Response time 10-20x lebih cepat
- 🔐 **JWT Authentication** - Secure token-based auth
- 🎭 **Role-Based Access Control** - Admin, Staf TU, Pimpinan, Staf Bidang
- 📚 **Comprehensive Swagger Documentation** - Interactive API testing
- 🤖 **AI Integration Ready** - Gemini AI untuk ekstraksi data surat
- 📊 **Winston Logging** - File rotation & monitoring
- 🗜️ **Compression** - gzip untuk optimal bandwidth
- 🔒 **Security** - Helmet, CORS, input validation

## 🎯 Current Implementation Status

### ✅ User Management (COMPLETED)
- 10 REST API endpoints dengan Redis caching
- Dokumentasi Swagger lengkap dengan examples
- Cache monitoring & logging
- Performance: 10-20x faster dengan cache

### 🚧 In Development
- Surat Masuk dengan AI
- Surat Keluar
- Disposisi

## 📋 Prerequisites

### Development
- Node.js 18+ 
- MySQL 8.0+
- Redis 7+
- npm atau yarn

### Production
- Docker & Docker Compose

## 🚀 Quick Start

### Development (Tanpa Docker - Dengan Hot Reload)

#### 1. Clone & Install
```bash
git clone <repository-url>
cd smart-e-arsip-api
npm install
```

#### 2. Setup Environment
```bash
cp .env.example .env
# Edit .env dengan konfigurasi local MySQL dan Redis
```

#### 3. Database Setup
```bash
npx prisma migrate dev
npx prisma generate
npx prisma db seed  # Seed database dengan user Kelompok Smart E-Arsip
```

**Seeded users** (password semua: `Password123!`):
- **Admin**: `ahda.admin`
- **Staf TU**: `ammaru.tu`, `kholifah.tu`
- **Pimpinan**: `mariana.pimpinan`
- **Staf Bidang**: `suaidi.bidang`, `pia.bidang`, `safitorul.bidang`

See [SEEDER_GUIDE.md](./SEEDER_GUIDE.md) for complete details.

#### 4. Run Development dengan Hot Reload
```bash
npm run start:dev
```
API akan berjalan di `http://localhost:3006` dengan hot reload aktif.

### Production (Dengan Docker)

#### 1. Setup Environment
```bash
cp .env.example .env
# Edit .env untuk production
```

#### 2. Start dengan Docker
```bash
# Build dan start semua services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f api
```

#### 3. Start dengan Nginx (Optional)
```bash
docker-compose --profile with-nginx up -d
```

API akan berjalan di `http://localhost:3006` atau via Nginx di `http://localhost`

## 📚 Documentation

### API Documentation
- **Swagger UI**: `http://localhost:3006/api/docs` - Interactive API testing
- [User API Documentation](./USER_API_CACHE.md) - Complete guide dengan Redis caching
- [User API (Original)](./USER_API.md) - Original user API docs
- [Testing Guide](./TESTING_GUIDE.md) - Step-by-step testing cache behavior
- [Implementation Summary](./USER_IMPLEMENTATION_SUMMARY.md) - Technical implementation details

### Development Guides
- [Development Guide](./DEVELOPMENT.md) - Setup development environment
- [Security Guide](./SECURITY.md) - Security best practices
- [Redis Connection](./REDIS_CONNECTION.md) - Cara connect ke Redis

### Quick Links
- 🚀 [Quick Testing Guide](./TESTING_GUIDE.md#-quick-testing-guide---user-api-dengan-redis-caching)
- 📊 [Performance Metrics](./USER_IMPLEMENTATION_SUMMARY.md#-performance-metrics)
- ⚡ [Cache Strategy](./USER_API_CACHE.md#-redis-caching-strategy)

## 🧪 Testing Cache Performance

### Method 1: Swagger UI (Recommended)
1. Go to `http://localhost:3006/api/docs`
2. Authorize with Bearer token
3. Test `GET /users/1` twice
4. Compare response times:
   - **First**: ~50-100ms (from database)
   - **Second**: ~5-10ms ⚡ (from cache - **10x faster!**)

### Method 2: cURL
```bash
# First request (Cache MISS)
time curl -H "Authorization: Bearer TOKEN" http://localhost:3006/api/users/1

# Second request (Cache HIT - much faster!)
time curl -H "Authorization: Bearer TOKEN" http://localhost:3006/api/users/1
```

### Method 3: Watch Logs
```bash
tail -f logs/combined.log | grep -E "Cache|UserService"

# You'll see:
# [UserService] Cache MISS for user:1
# [UserService] Cached user: user:1
# [UserService] Cache HIT for user:1  ← Second request
```

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for comprehensive testing steps.

## 🔧 Available Scripts

```bash
# Development
npm run start:dev      # Run dengan hot reload

# Production
npm run build          # Build production
npm run start:prod     # Run production

# Testing
npm run test           # Unit tests
npm run test:e2e       # E2E tests
npm run test:cov       # Test coverage

# Database
npx prisma migrate dev    # Run migrations
npx prisma generate       # Generate Prisma client
npx prisma studio        # Open Prisma Studio
npx prisma db seed       # Seed database
```

## 🏗️ Tech Stack

- **Framework:** NestJS 11
- **Language:** TypeScript 5.7
- **Database:** MySQL 8.0
- **Cache:** Redis 7 (with cache-manager)
- **ORM:** Prisma 6
- **Authentication:** JWT (passport-jwt)
- **Validation:** class-validator + class-transformer
- **Documentation:** Swagger/OpenAPI 3.0
- **Logging:** Winston with file rotation
- **Security:** Helmet + CORS
- **Compression:** gzip level 6

## 🎯 API Endpoints

### User Management (✅ Implemented)

| Method | Endpoint | Description | Cache |
|--------|----------|-------------|-------|
| POST | `/users` | Create user | ❌ Invalidate |
| GET | `/users` | Get all users | ✅ 1 hour |
| GET | `/users/stats` | User statistics | ✅ 5 min |
| GET | `/users/search?q=` | Search users | ✅ 10 min |
| GET | `/users/by-role/:role` | Users by role | ✅ 1 hour |
| GET | `/users/:id` | Get user detail | ✅ 1 hour |
| PATCH | `/users/:id` | Update user | ❌ Invalidate |
| PATCH | `/users/:id/change-password` | Change password | ⚪ No cache |
| PATCH | `/users/:id/toggle-active` | Toggle status | ❌ Invalidate |
| DELETE | `/users/:id` | Delete user | ❌ Invalidate |

**All endpoints** require JWT Bearer token authentication.

See [USER_API_CACHE.md](./USER_API_CACHE.md) for detailed documentation.

## ⚡ Performance Metrics

| Operation | Without Cache | With Cache | Improvement |
|-----------|---------------|------------|-------------|
| GET /users | ~80ms | ~8ms | **10x faster** ⚡ |
| GET /users/:id | ~50ms | ~5ms | **10x faster** ⚡ |
| GET /users/stats | ~120ms | ~6ms | **20x faster** ⚡ |
| Search users | ~90ms | ~7ms | **12x faster** ⚡ |

## 📊 Cache Strategy

### Redis Cache Keys
```
user:{id}                      # Individual user (TTL: 1h)
users:list:{role}:{isActive}   # User list (TTL: 1h)
user:stats                     # Statistics (TTL: 5m)
user:search:{term}             # Search results (TTL: 10m)
```

### Auto-Invalidation
Cache automatically invalidated on:
- Create user → List caches cleared
- Update user → Individual + list caches cleared
- Delete user → All related caches cleared

## 📝 License

MIT Licensed

