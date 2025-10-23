# 🔧 Troubleshooting - CSP & Cache Issues

## ❌ Error: Content Security Policy Blocking Swagger

### Error Message:
```
Content-Security-Policy: Pengaturan halaman memblokir pemuatan sumber daya (connect-src) 
di http://localhost:3005/api/auth/login karena menyalahi direktif berikut: "default-src 'self'"
```

### ✅ Solution Applied:

#### 1. Updated Helmet CSP Configuration

File: `src/main.ts`

```typescript
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", ...frontendUrls, 'http://localhost:3006'],
      },
    },
  }),
);
```

#### 2. Clean Build & Restart

```bash
# Clean old build
rm -rf dist
npm run build

# Restart server
npm run start:dev
```

---

## 🌐 Browser Cache Issues

### If You Still See Port 3005:

The browser or Swagger UI might be caching the old configuration.

### Solution 1: Hard Refresh Browser

**Chrome/Edge:**
- Windows: `Ctrl + Shift + R` or `Ctrl + F5`
- Mac: `Cmd + Shift + R`

**Firefox:**
- Windows: `Ctrl + Shift + R` or `Ctrl + F5`
- Mac: `Cmd + Shift + R`

### Solution 2: Clear Browser Cache

**Chrome:**
1. Press `F12` to open DevTools
2. Right-click on refresh button
3. Select "Empty Cache and Hard Reload"

**Firefox:**
1. `Ctrl + Shift + Delete`
2. Select "Cache"
3. Click "Clear Now"

**Edge:**
1. `Ctrl + Shift + Delete`
2. Select "Cached images and files"
3. Click "Clear now"

### Solution 3: Incognito/Private Mode

Open Swagger in incognito/private window:
- Chrome: `Ctrl + Shift + N`
- Firefox: `Ctrl + Shift + P`
- Edge: `Ctrl + Shift + N`

Then access: `http://localhost:3006/api/docs`

### Solution 4: Clear Service Workers

1. Open DevTools (`F12`)
2. Go to "Application" tab
3. Click "Service Workers"
4. Click "Unregister" for all workers
5. Refresh page

---

## 🔍 Verify Server is Running on Correct Port

### Check Server Logs

When you start the server, you should see:

```
╔══════════════════════════════════════════════════════════╗
║         🚀 Smart E-Arsip API - Server Started           ║
╠══════════════════════════════════════════════════════════╣
║  📡 Server URL:        http://[::1]:3006                ║
║  📚 API Documentation: http://[::1]:3006/api/docs       ║
...
╚══════════════════════════════════════════════════════════╝
```

If you see **3005** instead of **3006**, check:

1. **`.env` file**:
   ```env
   APP_PORT=3006
   ```

2. **Restart the server**:
   ```bash
   # Stop current server (Ctrl+C)
   npm run start:dev
   ```

### Test with cURL

```bash
# Should respond on 3006
curl http://localhost:3006/api/health

# Should fail on 3005
curl http://localhost:3005/api/health
```

---

## 🧪 Complete Testing Steps

### 1. Stop All Running Servers

```bash
# Kill all node processes
# Windows (PowerShell)
Get-Process node | Stop-Process -Force

# Linux/Mac
killall node
```

### 2. Clean Build

```bash
cd C:\MyData\smart-e-arsip-api
rm -rf dist node_modules/.cache
npm run build
```

### 3. Check .env

```bash
cat .env | grep PORT
```

Should show:
```
APP_PORT=3006
```

### 4. Start Server

```bash
npm run start:dev
```

### 5. Close ALL Browser Windows

Completely close and reopen browser to clear all cache.

### 6. Access Swagger UI

```
http://localhost:3006/api/docs
```

### 7. Test Login

In Swagger UI, test `POST /auth/login`:

```json
{
  "username": "ahda.admin",
  "password": "Password123!"
}
```

Should work without CSP errors!

---

## 🔐 CSP Configuration Explained

### Why We Need These Directives:

```typescript
contentSecurityPolicy: {
  directives: {
    // Allow same origin
    defaultSrc: ["'self'"],
    
    // Swagger needs inline styles
    styleSrc: ["'self'", "'unsafe-inline'"],
    
    // Swagger needs inline scripts and eval
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    
    // Allow images from data URIs and HTTPS
    imgSrc: ["'self'", 'data:', 'https:'],
    
    // Allow API calls to backend and frontend
    connectSrc: ["'self'", ...frontendUrls, 'http://localhost:3006'],
  },
}
```

### Security Notes:

⚠️ **Development vs Production**

For **production**, you should tighten these rules:
- Remove `'unsafe-inline'` and `'unsafe-eval'`
- Use specific domains instead of wildcards
- Add nonces or hashes for scripts

Example production config:
```typescript
if (process.env.NODE_ENV === 'production') {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", 'https://trusted-cdn.com'],
          scriptSrc: ["'self'", 'https://trusted-cdn.com'],
          imgSrc: ["'self'", 'https:', 'data:'],
          connectSrc: ["'self'", 'https://api.yourdomain.com'],
        },
      },
    }),
  );
} else {
  // Development - more permissive for Swagger
  app.use(helmet({ /* current config */ }));
}
```

---

## 🚨 Common Errors & Solutions

### Error 1: "Failed to fetch"

**Cause**: Wrong port or server not running

**Solution**:
```bash
# Check server is running
curl http://localhost:3006/api/health

# If not, start it
npm run start:dev
```

### Error 2: "NetworkError when attempting to fetch resource"

**Cause**: CORS or CSP blocking

**Solution**:
1. Check CSP configuration (see above)
2. Verify frontend URL in `.env`:
   ```env
   FRONTEND_URLS=http://localhost:3003
   ```
3. Restart server

### Error 3: Swagger UI shows old port (3005)

**Cause**: Browser cache

**Solution**:
1. Hard refresh: `Ctrl + Shift + R`
2. Or use incognito mode
3. Or clear browser cache completely

### Error 4: "Cannot GET /api/docs"

**Cause**: Swagger not initialized

**Solution**:
Check `src/main.ts` has:
```typescript
SwaggerModule.setup('api/docs', app, document);
```

Restart server.

---

## ✅ Verification Checklist

After applying fixes, verify:

- [ ] Server starts on port **3006** (check logs)
- [ ] Swagger UI loads at `http://localhost:3006/api/docs`
- [ ] No CSP errors in browser console
- [ ] Login endpoint works in Swagger
- [ ] Can authorize with token
- [ ] Protected endpoints work with token

---

## 📞 Still Having Issues?

### 1. Check Browser Console

Press `F12` → Console tab

Look for:
- CSP violations
- Network errors
- CORS errors

### 2. Check Server Logs

Look for:
- Port binding errors
- Database connection issues
- Redis connection issues

### 3. Verify Environment

```bash
# Check Node version (should be 18+)
node --version

# Check npm version
npm --version

# Check .env file
cat .env
```

### 4. Clean Install

```bash
# Remove node_modules and reinstall
rm -rf node_modules dist
npm install
npm run build
npm run start:dev
```

---

## 🎉 Success!

If everything works, you should:

✅ See server running on port 3006
✅ Access Swagger UI without errors
✅ Test login successfully
✅ No CSP errors in console
✅ API calls work from frontend (port 3003)

**Happy coding!** 🚀
