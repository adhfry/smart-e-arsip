# 🧪 Testing API dengan cURL - Smart E-Arsip

## 📋 Overview

Panduan lengkap untuk testing API Smart E-Arsip menggunakan cURL dengan authentication.

## 🔐 Authentication Flow

### 1. Login untuk Mendapatkan Token

```bash
curl -X POST http://localhost:3005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ahda.admin",
    "password": "Password123!"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 900,
  "user": {
    "id": 1,
    "username": "ahda.admin",
    "nama_lengkap": "Ahda Ahda",
    "email": "ahda@smartearsip.id",
    "role": "admin"
  }
}
```

### 2. Simpan Token ke Variable

**Bash/Linux/Mac:**
```bash
# Otomatis extract token
TOKEN=$(curl -s -X POST http://localhost:3005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"ahda.admin","password":"Password123!"}' \
  | jq -r '.access_token')

echo "Token: $TOKEN"
```

**PowerShell/Windows:**
```powershell
# Login dan extract token
$response = Invoke-RestMethod -Uri "http://localhost:3005/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"username":"ahda.admin","password":"Password123!"}'

$TOKEN = $response.access_token
Write-Host "Token: $TOKEN"
```

---

## 📋 Testing User Endpoints

### GET All Users (dengan token)

```bash
curl -X GET 'http://localhost:3005/api/users' \
  -H "accept: application/json" \
  -H "Authorization: Bearer $TOKEN"
```

**atau manual:**
```bash
curl -X GET 'http://localhost:3005/api/users' \
  -H "accept: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### GET Users dengan Filter

**Filter by active users:**
```bash
curl -X GET 'http://localhost:3005/api/users?isActive=true' \
  -H "accept: application/json" \
  -H "Authorization: Bearer $TOKEN"
```

**Filter by role:**
```bash
curl -X GET 'http://localhost:3005/api/users?role=admin' \
  -H "accept: application/json" \
  -H "Authorization: Bearer $TOKEN"
```

**Filter kombinasi:**
```bash
curl -X GET 'http://localhost:3005/api/users?role=staf_bidang&isActive=true' \
  -H "accept: application/json" \
  -H "Authorization: Bearer $TOKEN"
```

### GET User by ID

```bash
curl -X GET 'http://localhost:3005/api/users/1' \
  -H "accept: application/json" \
  -H "Authorization: Bearer $TOKEN"
```

### GET User Statistics

```bash
curl -X GET 'http://localhost:3005/api/users/stats' \
  -H "accept: application/json" \
  -H "Authorization: Bearer $TOKEN"
```

### Search Users

```bash
curl -X GET 'http://localhost:3005/api/users/search?q=ahmad' \
  -H "accept: application/json" \
  -H "Authorization: Bearer $TOKEN"
```

### GET Users by Role

```bash
curl -X GET 'http://localhost:3005/api/users/by-role/staf_bidang' \
  -H "accept: application/json" \
  -H "Authorization: Bearer $TOKEN"
```

### Create User (POST)

```bash
curl -X POST 'http://localhost:3005/api/users' \
  -H "accept: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nama_lengkap": "Test User",
    "username": "test.user",
    "email": "test@smartearsip.id",
    "phone": "081234567898",
    "password": "TestPass123!",
    "role": "staf_bidang"
  }'
```

### Update User (PATCH)

```bash
curl -X PATCH 'http://localhost:3005/api/users/1' \
  -H "accept: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nama_lengkap": "Ahmad Suryadi Updated"
  }'
```

### Change Password

```bash
curl -X PATCH 'http://localhost:3005/api/users/1/change-password' \
  -H "accept: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "Password123!",
    "newPassword": "NewPassword456!"
  }'
```

### Toggle Active Status

```bash
curl -X PATCH 'http://localhost:3005/api/users/1/toggle-active' \
  -H "accept: application/json" \
  -H "Authorization: Bearer $TOKEN"
```

### Delete User

```bash
curl -X DELETE 'http://localhost:3005/api/users/1' \
  -H "accept: application/json" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔐 Testing Auth Endpoints

### Register New User

```bash
curl -X POST 'http://localhost:3005/api/auth/register' \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "nama_lengkap": "New User",
    "username": "new.user",
    "email": "new@smartearsip.id",
    "password": "NewPass123!",
    "role": "staf_bidang"
  }'
```

### Get Current User Info

```bash
curl -X GET 'http://localhost:3005/api/auth/me' \
  -H "accept: application/json" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Active Session

```bash
curl -X GET 'http://localhost:3005/api/auth/session' \
  -H "accept: application/json" \
  -H "Authorization: Bearer $TOKEN"
```

### Refresh Token

```bash
curl -X POST 'http://localhost:3005/api/auth/refresh' \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d "{
    \"refresh_token\": \"$REFRESH_TOKEN\"
  }"
```

### Logout

```bash
curl -X POST 'http://localhost:3005/api/auth/logout' \
  -H "accept: application/json" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🧪 Complete Testing Script

### Bash Script (Linux/Mac)

Simpan sebagai `test-api.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3005/api"

echo "🔐 Step 1: Login..."
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"ahda.admin","password":"Password123!"}')

TOKEN=$(echo $RESPONSE | jq -r '.access_token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo "❌ Login failed!"
    echo $RESPONSE
    exit 1
fi

echo "✅ Login successful!"
echo "Token: ${TOKEN:0:50}..."

echo ""
echo "📋 Step 2: Get all users..."
curl -s -X GET "$BASE_URL/users" \
  -H "Authorization: Bearer $TOKEN" | jq

echo ""
echo "📊 Step 3: Get user statistics..."
curl -s -X GET "$BASE_URL/users/stats" \
  -H "Authorization: Bearer $TOKEN" | jq

echo ""
echo "🔍 Step 4: Search users..."
curl -s -X GET "$BASE_URL/users/search?q=ahda" \
  -H "Authorization: Bearer $TOKEN" | jq

echo ""
echo "👤 Step 5: Get current user info..."
curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN" | jq

echo ""
echo "✅ All tests completed!"
```

**Jalankan:**
```bash
chmod +x test-api.sh
./test-api.sh
```

### PowerShell Script (Windows)

Simpan sebagai `test-api.ps1`:

```powershell
$BASE_URL = "http://localhost:3005/api"

Write-Host "🔐 Step 1: Login..." -ForegroundColor Cyan
$loginResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"username":"ahda.admin","password":"Password123!"}'

$TOKEN = $loginResponse.access_token

if (-not $TOKEN) {
    Write-Host "❌ Login failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Login successful!" -ForegroundColor Green
Write-Host "Token: $($TOKEN.Substring(0, 50))..."

Write-Host "`n📋 Step 2: Get all users..." -ForegroundColor Cyan
$users = Invoke-RestMethod -Uri "$BASE_URL/users" `
  -Method GET `
  -Headers @{ Authorization = "Bearer $TOKEN" }
$users | ConvertTo-Json -Depth 10

Write-Host "`n📊 Step 3: Get user statistics..." -ForegroundColor Cyan
$stats = Invoke-RestMethod -Uri "$BASE_URL/users/stats" `
  -Method GET `
  -Headers @{ Authorization = "Bearer $TOKEN" }
$stats | ConvertTo-Json

Write-Host "`n🔍 Step 4: Search users..." -ForegroundColor Cyan
$searchResult = Invoke-RestMethod -Uri "$BASE_URL/users/search?q=ahda" `
  -Method GET `
  -Headers @{ Authorization = "Bearer $TOKEN" }
$searchResult | ConvertTo-Json -Depth 10

Write-Host "`n👤 Step 5: Get current user info..." -ForegroundColor Cyan
$me = Invoke-RestMethod -Uri "$BASE_URL/auth/me" `
  -Method GET `
  -Headers @{ Authorization = "Bearer $TOKEN" }
$me | ConvertTo-Json

Write-Host "`n✅ All tests completed!" -ForegroundColor Green
```

**Jalankan:**
```powershell
.\test-api.ps1
```

---

## ⚠️ Common Errors

### 1. 401 Unauthorized

**Problem:**
```bash
curl -X GET 'http://localhost:3005/api/users' \
  -H "accept: application/json"
```

**Error:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Solution:** Tambahkan header Authorization!
```bash
curl -X GET 'http://localhost:3005/api/users' \
  -H "accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Token Expired

**Error:**
```json
{
  "statusCode": 401,
  "message": "jwt expired"
}
```

**Solution:** Login ulang atau refresh token:
```bash
# Option 1: Login ulang
TOKEN=$(curl -s -X POST http://localhost:3005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"ahda.admin","password":"Password123!"}' \
  | jq -r '.access_token')

# Option 2: Refresh token
curl -X POST 'http://localhost:3005/api/auth/refresh' \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\": \"$REFRESH_TOKEN\"}"
```

### 3. Invalid Token Format

**Wrong:**
```bash
-H "Authorization: $TOKEN"              # ❌ Missing "Bearer"
-H "Authorization: bearer $TOKEN"       # ❌ lowercase
-H "Bearer $TOKEN"                      # ❌ Missing "Authorization:"
```

**Correct:**
```bash
-H "Authorization: Bearer $TOKEN"       # ✅ Correct format
```

---

## 📊 Testing Cache Performance

### Test Cache HIT/MISS

```bash
#!/bin/bash

TOKEN=$(curl -s -X POST http://localhost:3005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"ahda.admin","password":"Password123!"}' \
  | jq -r '.access_token')

echo "🧪 Testing Cache Performance..."
echo ""

echo "1️⃣ First Request (Cache MISS - dari database):"
time curl -s -X GET "http://localhost:3005/api/users/1" \
  -H "Authorization: Bearer $TOKEN" > /dev/null

echo ""
echo "2️⃣ Second Request (Cache HIT - dari Redis):"
time curl -s -X GET "http://localhost:3005/api/users/1" \
  -H "Authorization: Bearer $TOKEN" > /dev/null

echo ""
echo "3️⃣ Third Request (Cache HIT - dari Redis):"
time curl -s -X GET "http://localhost:3005/api/users/1" \
  -H "Authorization: Bearer $TOKEN" > /dev/null

echo ""
echo "✅ Check server logs untuk lihat Cache HIT/MISS!"
```

---

## 💡 Pro Tips

### 1. Pretty Print JSON dengan jq

```bash
curl -X GET 'http://localhost:3005/api/users' \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 2. Save Response to File

```bash
curl -X GET 'http://localhost:3005/api/users' \
  -H "Authorization: Bearer $TOKEN" \
  -o users.json

cat users.json | jq
```

### 3. Show Response Headers

```bash
curl -i -X GET 'http://localhost:3005/api/users' \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Verbose Mode (Debug)

```bash
curl -v -X GET 'http://localhost:3005/api/users' \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Silent Mode

```bash
curl -s -X GET 'http://localhost:3005/api/users' \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🎯 Quick Reference

### Login & Save Token (One-liner)
```bash
# Bash
TOKEN=$(curl -s -X POST http://localhost:3005/api/auth/login -H "Content-Type: application/json" -d '{"username":"ahda.admin","password":"Password123!"}' | jq -r '.access_token')

# PowerShell
$TOKEN = (Invoke-RestMethod -Uri "http://localhost:3005/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"ahda.admin","password":"Password123!"}').access_token
```

### Test Authenticated Endpoint
```bash
# Bash
curl -X GET "http://localhost:3005/api/users" -H "Authorization: Bearer $TOKEN"

# PowerShell
Invoke-RestMethod -Uri "http://localhost:3005/api/users" -Headers @{ Authorization = "Bearer $TOKEN" }
```

---

## 🎉 Summary

✅ **Selalu gunakan Authorization header** untuk endpoint yang protected
✅ **Format**: `Authorization: Bearer YOUR_TOKEN`
✅ **Token dari login** response (`access_token`)
✅ **Token expired** setelah 15 menit (use refresh token)
✅ **Test dengan script** untuk automated testing

**Happy testing!** 🚀
