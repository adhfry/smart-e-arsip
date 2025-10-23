# 🔄 Port Configuration Changes

## 📋 Summary

All ports have been updated to the new configuration:

### Backend API
- **Old Port**: 3005
- **New Port**: 3006
- **URL**: `http://localhost:3006`

### Frontend
- **Old Port**: 3002
- **New Port**: 3003
- **URL**: `http://localhost:3003`

---

## ✅ Files Updated

### Configuration Files
- ✅ `.env` - Updated `APP_PORT=3006` and `FRONTEND_URLS=http://localhost:3003`
- ✅ `.env.example` - Updated default ports
- ✅ `src/main.ts` - Updated default port and CORS configuration
- ✅ `docker-compose.yml` - Updated container port mappings
- ✅ `nginx/nginx.conf` - Updated upstream backend port

### Documentation Files
- ✅ `README.md`
- ✅ `AUTH_API.md`
- ✅ `CURL_TESTING_GUIDE.md`
- ✅ `QUICK_REFERENCE.md`
- ✅ `TESTING_GUIDE.md`
- ✅ `USER_API_CACHE.md`
- ✅ `SEEDER_GUIDE.md`
- ✅ `QUICK_COMMANDS.md`

---

## 🚀 How to Use

### 1. Start Backend (Development)

```bash
npm run start:dev
```

Server will start on: `http://localhost:3006`

### 2. Access Swagger UI

```
http://localhost:3006/api/docs
```

### 3. Test API Endpoints

All endpoints now use port **3006**:

```bash
# Login
curl -X POST http://localhost:3006/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"ahda.admin","password":"Password123!"}'

# Get users
curl -X GET http://localhost:3006/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Frontend Connection

Your frontend (port 3003) is now allowed in CORS:

```javascript
// Frontend API calls
const API_URL = 'http://localhost:3006/api';

// Example fetch
fetch(`${API_URL}/users`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 🐳 Docker Configuration

### Start with Docker Compose

```bash
docker-compose up -d
```

Ports mapping:
- API: `3006:3006`
- MySQL: `3306:3306`
- Redis: `6379:6379`

### Check Services

```bash
# API
curl http://localhost:3006/api/health

# Swagger
open http://localhost:3006/api/docs
```

---

## 🔧 Environment Variables

Your `.env` should have:

```env
APP_PORT=3006
APP_URL=http://localhost:3006
FRONTEND_URLS=http://localhost:3003
```

For production with multiple frontends:

```env
FRONTEND_URLS=http://localhost:3003,https://yourdomain.com,https://app.yourdomain.com
```

---

## 🌐 CORS Configuration

CORS is configured to allow:
- `http://localhost:3003` (Development Frontend)
- Additional URLs from `FRONTEND_URLS` environment variable

### Adding More Origins

Edit `.env`:

```env
FRONTEND_URLS=http://localhost:3003,http://192.168.1.100:3003,https://prod.domain.com
```

Restart server to apply changes.

---

## 🔍 Troubleshooting

### Port Already in Use

If port 3006 is already in use:

**Check:**
```bash
# Windows
netstat -ano | findstr :3006

# Linux/Mac
lsof -i :3006
```

**Solution:**
1. Stop the process using the port
2. Or change port in `.env`:
   ```env
   APP_PORT=3007
   ```

### CORS Errors from Frontend

If you get CORS errors:

1. **Check frontend URL is in FRONTEND_URLS**:
   ```env
   FRONTEND_URLS=http://localhost:3003
   ```

2. **Restart backend** after changing `.env`

3. **Check browser console** for exact error

4. **Verify request includes credentials** if needed:
   ```javascript
   fetch(url, {
     credentials: 'include'  // If using cookies
   });
   ```

---

## 📊 Port Summary

| Service | Port | URL |
|---------|------|-----|
| Backend API | 3006 | http://localhost:3006 |
| Frontend | 3003 | http://localhost:3003 |
| Swagger UI | 3006 | http://localhost:3006/api/docs |
| MySQL | 3306 | localhost:3306 |
| Redis | 6379 | localhost:6379 |

---

## ✅ Verification Steps

### 1. Check Backend Running

```bash
curl http://localhost:3006/api/health
```

Expected: Success response

### 2. Check Swagger UI

Open: `http://localhost:3006/api/docs`

Expected: Swagger documentation loads

### 3. Test CORS from Frontend

```javascript
// From frontend (localhost:3003)
fetch('http://localhost:3006/api/users', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(data => console.log('Success:', data))
.catch(err => console.error('CORS Error:', err));
```

Expected: No CORS errors

---

## 🎯 Quick Test Commands

### PowerShell
```powershell
# Test backend is running
Invoke-WebRequest -Uri "http://localhost:3006/api/health"

# Login
$r = Invoke-RestMethod -Uri "http://localhost:3006/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"username":"ahda.admin","password":"Password123!"}'

$TOKEN = $r.access_token

# Test endpoint
Invoke-RestMethod -Uri "http://localhost:3006/api/users" `
  -Headers @{ Authorization = "Bearer $TOKEN" }
```

### Bash
```bash
# Test backend
curl http://localhost:3006/api/health

# Login
TOKEN=$(curl -s -X POST http://localhost:3006/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"ahda.admin","password":"Password123!"}' \
  | jq -r '.access_token')

# Test endpoint
curl -X GET http://localhost:3006/api/users \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🎉 Summary

✅ **Backend Port**: Changed from 3005 → **3006**
✅ **Frontend Port**: Changed from 3002 → **3003**
✅ **CORS**: Configured for localhost:3003
✅ **All Documentation**: Updated
✅ **Docker**: Configured
✅ **Nginx**: Updated
✅ **Build**: Successful

**Ready to use!** 🚀
