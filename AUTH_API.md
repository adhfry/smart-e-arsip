# 🔐 Authentication API - Smart E-Arsip

## 📚 Overview

Sistem autentikasi lengkap dengan JWT tokens, Redis session management, dan token refresh mechanism.

## 🚀 Base URL

```
http://localhost:3005/api/auth
```

## ⚡ Redis-Powered Features

### Session Management
- **Refresh Token Storage**: `refresh_token:{userId}`
- **Active Session**: `session:{userId}`
- **Token Blacklist**: `blacklist:{token}`

### TTL (Time To Live)
- Access Token: **15 minutes**
- Refresh Token: **7 days**
- Session: **7 days**
- Blacklisted Token: Until original expiration

---

## 📋 Endpoints

### 1. ��� Register User Baru
**POST** `/auth/register`

Registrasi user baru dengan auto-login.

**Request Body:**
```json
{
  "nama_lengkap": "Budi Santoso",
  "username": "budi.user",
  "email": "budi@smartearsip.id",
  "phone": "081234567898",
  "password": "Password123!",
  "role": "staf_bidang"
}
```

**Response (201):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 900,
  "user": {
    "id": 8,
    "username": "budi.user",
    "nama_lengkap": "Budi Santoso",
    "email": "budi@smartearsip.id",
    "role": "staf_bidang"
  }
}
```

**Validasi:**
- Username: minimal 3 karakter, huruf kecil/angka/.-_
- Password: minimal 8 karakter, harus ada huruf besar, kecil, angka, simbol
- Email: format valid (opsional)
- Phone: format Indonesia 08xxx atau 62xxx (opsional)

---

### 2. 🔑 Login
**POST** `/auth/login`

Login dengan username & password.

**Request Body:**
```json
{
  "username": "ahda.admin",
  "password": "Password123!"
}
```

**Response (200):**
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

**Test Credentials (dari seeder):**
```
Admin:       ahda.admin / Password123!
Staf TU:     ammaru.tu / Password123!
Pimpinan:    mariana.pimpinan / Password123!
Staf Bidang: suaidi.bidang / Password123!
```

---

### 3. 🚪 Logout
**POST** `/auth/logout`

Logout dan invalidate session.

**Authorization:** Bearer Token (required)

**Response (204):** No Content

**Redis Operations:**
- ✅ Token ditambahkan ke blacklist
- ✅ Refresh token dihapus
- ✅ Session dihapus

**Example:**
```bash
curl -X POST http://localhost:3005/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 4. 🔄 Refresh Token
**POST** `/auth/refresh`

Mendapatkan access token baru menggunakan refresh token.

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "access_token": "NEW_ACCESS_TOKEN...",
  "refresh_token": "NEW_REFRESH_TOKEN...",
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

**Use Case:**
- Access token expired (setelah 15 menit)
- User masih aktif di aplikasi
- Tidak perlu login ulang

---

### 5. 👤 Get Current User
**GET** `/auth/me`

Mendapatkan info user yang sedang login.

**Authorization:** Bearer Token (required)

**Response (200):**
```json
{
  "id": 1,
  "username": "ahda.admin",
  "nama_lengkap": "Ahda Ahda",
  "email": "ahda@smartearsip.id",
  "phone": "081234567891",
  "role": "admin",
  "isActive": true,
  "createdAt": "2025-10-23T10:00:00.000Z",
  "updatedAt": "2025-10-23T10:00:00.000Z"
}
```

---

### 6. 🕐 Get Active Session
**GET** `/auth/session`

Melihat session info dari Redis.

**Authorization:** Bearer Token (required)

**Response (200):**
```json
{
  "userId": 1,
  "username": "ahda.admin",
  "role": "admin",
  "loginAt": "2025-10-23T10:00:00.000Z"
}
```

---

## 🧪 Testing dengan Swagger

### 1. Register User Baru
```
POST /auth/register
Body: {
  "nama_lengkap": "Test User",
  "username": "test.user",
  "email": "test@smartearsip.id",
  "password": "TestPass123!",
  "role": "staf_bidang"
}
```

### 2. Login
```
POST /auth/login
Body: {
  "username": "ahda.admin",
  "password": "Password123!"
}
```

### 3. Copy Access Token
Dari response login, copy `access_token`.

### 4. Authorize di Swagger
Klik "Authorize" → Masukkan: `Bearer YOUR_TOKEN` → Authorize

### 5. Test Endpoints Terproteksi
```
GET /auth/me          # Lihat info user
GET /auth/session     # Lihat session Redis
GET /users            # Test akses API lain
```

### 6. Test Token Refresh
```
POST /auth/refresh
Body: {
  "refresh_token": "YOUR_REFRESH_TOKEN"
}
```

### 7. Logout
```
POST /auth/logout
```

---

## 🔒 Security Features

### 1. **Password Hashing**
- Bcrypt dengan cost factor 10
- Password tidak pernah disimpan plain text

### 2. **JWT Tokens**
- Access Token: Short-lived (15 min)
- Refresh Token: Long-lived (7 days)
- Signed dengan secret key

### 3. **Token Blacklist**
- Logout tokens masuk blacklist di Redis
- Tidak bisa digunakan meskipun belum expired

### 4. **Session Management**
- Session info di Redis
- Dapat revoke semua session user
- Auto cleanup saat expired

### 5. **Validation**
- Strong password requirements
- Username format validation
- Email & phone validation

---

## ⚡ Redis Cache Strategy

### Cache Keys
```typescript
// Refresh Token
refresh_token:{userId}     // TTL: 7 days
// Example: refresh_token:1

// Active Session
session:{userId}           // TTL: 7 days
// Example: session:1

// Token Blacklist
blacklist:{token}          // TTL: remaining token lifetime
// Example: blacklist:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Operations

#### Login
```typescript
1. Verify credentials
2. Generate access_token & refresh_token
3. Store refresh_token in Redis
4. Store session in Redis
5. Return tokens to client
```

#### Logout
```typescript
1. Add access_token to blacklist
2. Delete refresh_token from Redis
3. Delete session from Redis
```

#### Refresh
```typescript
1. Verify refresh_token
2. Check token exists in Redis
3. Generate new tokens
4. Update Redis
5. Return new tokens
```

---

## 📊 Monitoring Redis

### View Refresh Tokens
```bash
redis-cli KEYS "refresh_token:*"
```

### View Active Sessions
```bash
redis-cli KEYS "session:*"
```

### View Blacklisted Tokens
```bash
redis-cli KEYS "blacklist:*"
```

### Get Session Data
```bash
redis-cli GET "session:1"
```

### Check TTL
```bash
redis-cli TTL "refresh_token:1"
```

---

## 🎯 Authentication Flow

### Complete Login Flow
```
1. User → POST /auth/login
2. Backend → Verify credentials
3. Backend → Generate tokens
4. Backend → Store in Redis:
   - refresh_token:1 → "token_value"
   - session:1 → { userId, username, role, loginAt }
5. Backend → Return tokens
6. Client → Store tokens (localStorage/cookie)
7. Client → Use access_token for API calls
```

### Token Refresh Flow
```
1. Client makes API request
2. Server returns 401 (token expired)
3. Client → POST /auth/refresh
4. Backend → Verify refresh_token in Redis
5. Backend → Generate new tokens
6. Backend → Update Redis
7. Backend → Return new tokens
8. Client → Retry original request with new token
```

### Logout Flow
```
1. Client → POST /auth/logout
2. Backend → Add token to blacklist
3. Backend → Delete refresh_token from Redis
4. Backend → Delete session from Redis
5. Client → Clear stored tokens
6. Client → Redirect to login
```

---

## 💡 Best Practices

### 1. **Token Storage (Frontend)**
```typescript
// Store tokens securely
localStorage.setItem('access_token', token);
localStorage.setItem('refresh_token', refresh);

// Always use Bearer format
headers: {
  'Authorization': `Bearer ${access_token}`
}
```

### 2. **Automatic Token Refresh**
```typescript
// Interceptor example (Axios)
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Try refresh
      const newToken = await refreshToken();
      // Retry request
      return axios.request(originalRequest);
    }
    return Promise.reject(error);
  }
);
```

### 3. **Logout on Tab Close**
```typescript
window.addEventListener('beforeunload', () => {
  // Optionally logout
  // Or just clear tokens
});
```

### 4. **Check Token Expiry**
```typescript
function isTokenExpired(token: string): boolean {
  const decoded = jwt_decode(token);
  return decoded.exp < Date.now() / 1000;
}
```

---

## 🚨 Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": ["Password harus mengandung huruf besar, huruf kecil, angka, dan simbol"],
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Username atau password salah",
  "error": "Unauthorized"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Username sudah digunakan",
  "error": "Conflict"
}
```

---

## 🎉 Summary

✅ **Complete JWT authentication**
✅ **Redis-powered session management**
✅ **Token refresh mechanism**
✅ **Token blacklist for logout**
✅ **Strong password validation**
✅ **Comprehensive Swagger docs**
✅ **Security best practices**

**Ready to use!** 🚀
