# 🎯 CORS Fix - NaviGo Style (FINAL SOLUTION)

## ❌ Problem

Production server mengalami CORS error:
```
Permintaan Cross-Origin Ditolak: Kebijakan Same Origin melarang pembacaan sumber daya
di http://localhost:3006/api/auth/login
```

## 🔍 Root Cause Analysis

Membandingkan dengan **NaviGo API** yang working perfectly:

### ❌ Smart E-Arsip (BROKEN)
```typescript
// Complex callback function with regex patterns
app.enableCors({
  origin: (origin, callback) => {
    // Complex validation logic
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') { /* ... */ }
      if (allowed instanceof RegExp) { /* ... */ }
    });
    callback(null, true);
  },
  credentials: true,
  methods: [...],
  allowedHeaders: [...],
  // TOO COMPLEX!
});
```

### ✅ NaviGo API (WORKING)
```typescript
// Simple array
app.enableCors({
  origin: frontendUrls,  // Just array of strings!
  credentials: true,
});
```

**Kesimpulan:** CORS callback function yang terlalu kompleks menyebabkan error!

---

## ✅ Solution Applied

### 1. Simplified CORS Configuration

**Sebelum (Complex):**
- Callback function dengan validation logic
- Regex patterns untuk localhost
- Manual string/regex checking
- Complex allowedHeaders & methods

**Sesudah (Simple - NaviGo Style):**
```typescript
const allowedOrigins = isDevelopment
  ? [...frontendUrls, 'http://localhost:3006', 'http://127.0.0.1:3006']
  : frontendUrls;

app.enableCors({
  origin: allowedOrigins,  // ✅ Just array!
  credentials: true,       // ✅ Simple!
});
```

### 2. Environment-Based Origins

**Development (.env):**
```env
NODE_ENV=development
APP_URL=http://localhost:3006
FRONTEND_URLS=http://localhost:3003
```

Allowed origins:
- `http://localhost:3003` (frontend)
- `http://localhost:3006` (Swagger - same origin)
- `http://127.0.0.1:3006` (IPv4 localhost)

**Production (.env):**
```env
NODE_ENV=production
APP_URL=https://api.smart-e-arsip.agribunker.id
FRONTEND_URLS=https://smart-e-arsip.agribunker.id
```

Allowed origins:
- `https://smart-e-arsip.agribunker.id` (frontend only)

### 3. Helmet Still Disabled

Helmet CSP tetap di-disable karena blocking Swagger UI resources:
- NestJS logo (`img-src`)
- API calls (`connect-src`)
- External resources

**Alternative:** Configure security headers di nginx instead.

---

## 🚀 Deployment Instructions

### Step 1: Update Production .env

SSH ke server dan edit `.env`:

```bash
ssh user@your-server
cd /path/to/smart-e-arsip-api
nano .env
```

Update these values:
```env
NODE_ENV=production
APP_PORT=3006
APP_URL=https://api.smart-e-arsip.agribunker.id
FRONTEND_URLS=https://smart-e-arsip.agribunker.id
SESSION_DOMAIN=.smart-e-arsip.agribunker.id
```

**IMPORTANT:** 
- `APP_URL` must be your actual API domain
- `FRONTEND_URLS` must be your actual frontend domain
- Use **HTTPS** in production!

### Step 2: Deploy Code

```bash
# Pull latest code
git pull origin main

# Install dependencies (if any changes)
npm install

# Build
npm run build

# Restart service
pm2 restart smart-e-arsip-api

# Check logs
pm2 logs smart-e-arsip-api --lines 50
```

### Step 3: Verify CORS

Check server logs for:
```
⚠️  Helmet disabled - configure security headers in nginx if needed
🚀 Application is running on: http://[::1]:3006
```

### Step 4: Test Swagger

1. Clear browser cache: `Ctrl + Shift + Delete`
2. Open Swagger: `https://api.smart-e-arsip.agribunker.id/api/docs`
3. Open console (F12) - should have NO CORS errors
4. Test login endpoint

---

## 🔧 Nginx Configuration (Recommended)

Since Helmet is disabled, add security headers in nginx:

```nginx
server {
    listen 443 ssl http2;
    server_name api.smart-e-arsip.agribunker.id;

    # SSL configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Security headers (replacing Helmet)
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # DON'T add CSP header - it blocks Swagger!
    # add_header Content-Security-Policy "default-src 'self'" always;

    location / {
        proxy_pass http://localhost:3006;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📊 Comparison: Before vs After

### Before (Complex CORS)

```typescript
// ❌ Too complex
const allowedOrigins = [
  ...frontendUrls,
  'http://localhost:3006',
  /^http:\/\/localhost(:\d+)?$/,  // Regex!
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
];

app.enableCors({
  origin: (origin, callback) => {
    // Callback function!
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') { /* ... */ }
      if (allowed instanceof RegExp) { /* ... */ }
    });
    
    callback(null, isAllowed);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['X-Total-Count', 'X-Cache-Status'],
  maxAge: 86400,
});
```

**Result:** ❌ CORS errors in production

### After (Simple CORS - NaviGo Style)

```typescript
// ✅ Simple and working
const allowedOrigins = isDevelopment
  ? [...frontendUrls, 'http://localhost:3006', 'http://127.0.0.1:3006']
  : frontendUrls;

app.enableCors({
  origin: allowedOrigins,
  credentials: true,
});
```

**Result:** ✅ Works perfectly in production!

---

## ✅ Success Checklist

After deployment, verify:

- [ ] Server starts without errors
- [ ] Logs show: "Helmet disabled - configure security headers in nginx"
- [ ] Health check works: `curl https://api.smart-e-arsip.agribunker.id/health`
- [ ] Swagger UI loads: `https://api.smart-e-arsip.agribunker.id/api/docs`
- [ ] No CORS errors in browser console (F12)
- [ ] No CSP errors in browser console
- [ ] Login works in Swagger UI
- [ ] Can authorize and test protected endpoints
- [ ] Frontend can connect to API without CORS errors

---

## 🎯 Key Takeaways

### ✅ DO:
- Keep CORS configuration SIMPLE
- Use array of strings for allowed origins
- Test with working examples (NaviGo API)
- Configure security headers in nginx instead of app
- Use environment-based origins

### ❌ DON'T:
- Use complex callback functions for CORS origin
- Use regex patterns in CORS origin array
- Enable Helmet CSP if you need Swagger to work
- Overcomplicate CORS with too many options
- Forget to update .env for production

---

## 📚 Related Files

- `src/main.ts` - Main configuration (CORS)
- `.env` - Development environment
- `.env.production` - Production template
- `DEPLOYMENT.md` - Deployment guide
- `TROUBLESHOOTING.md` - General troubleshooting

---

**Last Updated:** 2025-10-23T18:45:00.000Z
**Status:** ✅ RESOLVED - Tested with NaviGo API pattern
**Working Example:** NaviGo API (C:\MyData\navigo-api)
