# 🎯 Quick Reference - Smart E-Arsip API

## 🔑 Login & Get Token

**PowerShell:**
```powershell
$r = Invoke-RestMethod -Uri 'http://localhost:3006/api/auth/login' -Method POST -ContentType 'application/json' -Body '{"username":"ahda.admin","password":"Password123!"}'
$TOKEN = $r.access_token
Write-Host "Token: $TOKEN"
```

**Bash:**
```bash
TOKEN=$(curl -s -X POST http://localhost:3006/api/auth/login -H "Content-Type: application/json" -d '{"username":"ahda.admin","password":"Password123!"}' | jq -r '.access_token')
echo "Token: $TOKEN"
```

---

## 📋 Test Endpoints

### PowerShell
```powershell
# Get all users
Invoke-RestMethod -Uri 'http://localhost:3006/api/users' -Headers @{ Authorization = "Bearer $TOKEN" }

# Get active users
Invoke-RestMethod -Uri 'http://localhost:3006/api/users?isActive=true' -Headers @{ Authorization = "Bearer $TOKEN" }

# Get user by ID
Invoke-RestMethod -Uri 'http://localhost:3006/api/users/1' -Headers @{ Authorization = "Bearer $TOKEN" }

# Get stats
Invoke-RestMethod -Uri 'http://localhost:3006/api/users/stats' -Headers @{ Authorization = "Bearer $TOKEN" }

# Search
Invoke-RestMethod -Uri 'http://localhost:3006/api/users/search?q=ahda' -Headers @{ Authorization = "Bearer $TOKEN" }

# Get current user
Invoke-RestMethod -Uri 'http://localhost:3006/api/auth/me' -Headers @{ Authorization = "Bearer $TOKEN" }
```

### Bash/cURL
```bash
# Get all users
curl -X GET 'http://localhost:3006/api/users' -H "Authorization: Bearer $TOKEN"

# Get active users
curl -X GET 'http://localhost:3006/api/users?isActive=true' -H "Authorization: Bearer $TOKEN"

# Get user by ID
curl -X GET 'http://localhost:3006/api/users/1' -H "Authorization: Bearer $TOKEN"

# Get stats
curl -X GET 'http://localhost:3006/api/users/stats' -H "Authorization: Bearer $TOKEN"

# Search
curl -X GET 'http://localhost:3006/api/users/search?q=ahda' -H "Authorization: Bearer $TOKEN"

# Get current user
curl -X GET 'http://localhost:3006/api/auth/me' -H "Authorization: Bearer $TOKEN"
```

---

## 💡 Common Issues

### ❌ 401 Unauthorized
**Problem:** Missing or invalid token

**Solution:**
1. Login untuk get token
2. Pastikan format: `Authorization: Bearer YOUR_TOKEN`
3. Check token belum expired (15 menit)

### ❌ Token Expired
**Solution:** Login ulang atau refresh token

```powershell
# Login ulang
$r = Invoke-RestMethod -Uri 'http://localhost:3006/api/auth/login' -Method POST -ContentType 'application/json' -Body '{"username":"ahda.admin","password":"Password123!"}'
$TOKEN = $r.access_token
```

---

## 🎯 Test Credentials

```
Admin:       ahda.admin / Password123!
Staf TU:     ammaru.tu / Password123!
Pimpinan:    mariana.pimpinan / Password123!
Staf Bidang: suaidi.bidang / Password123!
```

---

## 🚀 Swagger UI (Easiest Way!)

1. Open: `http://localhost:3006/api/docs`
2. Test `POST /auth/login`
3. Copy `access_token`
4. Click **"Authorize"** button (top right)
5. Enter: `Bearer YOUR_TOKEN`
6. Click **"Authorize"**
7. Test any endpoint! ✅

---

## 📚 Full Documentation

- **CURL_TESTING_GUIDE.md** - Complete cURL guide
- **AUTH_API.md** - Authentication documentation
- **USER_API_CACHE.md** - User API with cache
- **TESTING_GUIDE.md** - General testing guide

---

**Happy testing! 🎉**
