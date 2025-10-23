# 🚨 Production Error: NetworkError - SOLVED

## ❌ Error yang Terjadi

```
TypeError: NetworkError when attempting to fetch resource.
```

Di production (Swagger UI tidak bisa fetch API)

---

## 🔍 Root Cause

### 1. CORS Terlalu Strict
- CORS hanya allow `FRONTEND_URLS` dari .env
- Swagger UI sendiri tidak di-allow (origin: localhost:3006)
- Request tanpa origin (Swagger internal) di-block

### 2. CSP (Content Security Policy) Conflict
- Helmet CSP terlalu strict untuk Swagger UI
- `connectSrc` tidak include localhost sendiri

---

## ✅ Solusi yang Diterapkan

### 1. Environment-Based Configuration

**Development Mode:**
- CSP disabled untuk Swagger UI debugging
- CORS allow localhost:3006 (Swagger UI)
- CORS allow requests tanpa origin

**Production Mode:**
- CSP enabled tapi relaxed untuk Swagger
- CORS allow specified frontend URLs
- CORS allow requests tanpa origin (mobile apps, curl)

### 2. Smart CORS Configuration

```typescript
app.enableCors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Swagger UI, mobile apps, curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
});
```

### 3. Added Health Check Endpoints

- `GET /health` - Simple health check
- `GET /api/health` - API prefix health check

---

## 🚀 Quick Fix Steps

### 1. Stop Current Server
```bash
Ctrl+C
```

### 2. Start Server
```bash
npm run start:dev
```

### 3. Clear Browser Cache & Reload
```
Ctrl + Shift + R
```

### 4. Test Swagger
```
http://localhost:3006/api/docs
```

---

## 🧪 Testing Checklist

After restart, verify:

- [ ] Server starts on port 3006
- [ ] Health check works: `http://localhost:3006/health`
- [ ] Swagger UI loads: `http://localhost:3006/api/docs`
- [ ] No CORS errors in console (F12)
- [ ] No CSP errors in console
- [ ] Login works in Swagger UI
- [ ] Can authorize with token

---

## 📊 Health Check

Test if API is running:

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3006/health"
```

**Expected:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-23T18:16:53.040Z",
  "environment": "development"
}
```

---

## 🔧 If Still Not Working

### 1. Hard Refresh Browser
```
Ctrl + Shift + R  (Windows)
Cmd + Shift + R   (Mac)
```

### 2. Clear All Browser Data
```
Ctrl + Shift + Delete
Select: Cached images and files
Clear
```

### 3. Use Incognito Mode
```
Ctrl + Shift + N  (Chrome/Edge)
Ctrl + Shift + P  (Firefox)
```

### 4. Test with cURL
```bash
curl http://localhost:3006/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"ahda.admin","password":"Password123!"}'
```

If cURL works but Swagger doesn't = browser cache issue!

---

## ✅ Success!

You're all set when:
- ✅ Swagger UI loads without errors
- ✅ Login works in Swagger
- ✅ No errors in browser console
- ✅ Can test all endpoints

**Happy coding!** 🚀

---

For detailed troubleshooting, see: `TROUBLESHOOTING.md`
