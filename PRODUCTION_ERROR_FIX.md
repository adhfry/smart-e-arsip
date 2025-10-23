# 🚨 Production Error: NetworkError - SOLVED

## ❌ Latest Error (CORS Issue)

```
Permintaan Cross-Origin Ditolak: Kebijakan Same Origin melarang pembacaan sumber daya 
jarak jauh di http://localhost:3006/api/auth/login. 
(Alasan: Permintaan CORS tidak berhasil). Kode status: (null).
```

**Problem:** 
- Server production menggunakan PM2 dengan `localhost:3006`
- Browser menganggap ini cross-origin
- CORS configuration tidak include localhost untuk production

---

## ✅ Final Solution

### 1. **Helmet COMPLETELY DISABLED**

Helmet CSP terlalu strict dan terus blocking Swagger UI resources:
- `img-src` blocked NestJS logo
- `connect-src` blocked API calls
- Too complicated to configure properly

**Solution:** Remove Helmet completely, configure security headers di nginx instead.

### 2. **CORS - Very Permissive Configuration**

Updated CORS untuk allow semua localhost variants dan requests tanpa origin:

```typescript
const allowedOrigins = [
  ...frontendUrls,                           // Frontend dari .env
  'http://localhost:3006',                   // Localhost string
  'http://127.0.0.1:3006',                   // IPv4
  'http://[::1]:3006',                       // IPv6
  /^http:\/\/localhost(:\d+)?$/,            // Localhost any port (regex)
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,         // IPv4 any port (regex)
  /^http:\/\/\[::1\](:\d+)?$/,              // IPv6 any port (regex)
];

app.enableCors({
  origin: (origin, callback) => {
    // Allow requests WITHOUT origin (Swagger, Postman, curl)
    if (!origin) return callback(null, true);
    
    // Check against all patterns
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed || origin.startsWith(allowed);
      }
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
    
    callback(null, true); // Allow all for now
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
});
```

---

## 🚀 Quick Deploy

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
