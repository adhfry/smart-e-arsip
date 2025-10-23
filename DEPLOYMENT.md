# 🚀 Deployment Guide - Production CSP Fix

## ❌ Production Error

```
Content-Security-Policy: Pengaturan halaman memblokir pemuatan sumber daya (connect-src) 
di http://localhost:3006/api/auth/login karena menyalahi direktif berikut: 
"connect-src 'self' http://localhost:3002 https://www.google-analytics.com"
```

**Problem:** CSP di production server terlalu strict, tidak mengizinkan Swagger UI untuk fetch ke API sendiri.

---

## ✅ Solution Applied

### Updated `src/main.ts`

CSP configuration sekarang **ALWAYS** mengizinkan Swagger UI untuk bekerja di production:

```typescript
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Swagger needs eval
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: [
          "'self'", 
          appUrl,                          // Production URL dari APP_URL env
          `http://localhost:${port}`,      // Localhost
          `http://127.0.0.1:${port}`,      // IPv4
          `http://[::1]:${port}`,          // IPv6
          ...frontendUrls,                 // Frontend URLs
          'https://www.google-analytics.com',
        ],
      },
    },
  }),
);
```

---

## 🔧 Deployment Steps

### 1. Update Code di Server Production

**Option A: Git Pull (Recommended)**

```bash
# SSH ke production server
ssh user@your-server

# Navigate to project
cd /path/to/smart-e-arsip-api

# Pull latest changes
git pull origin main

# Install dependencies (if any changes)
npm install

# Build
npm run build

# Restart server
pm2 restart smart-e-arsip-api
# or
systemctl restart smart-e-arsip-api
```

**Option B: Manual Upload**

Upload file yang sudah diubah:
- `src/main.ts`
- `dist/` folder (hasil build)

### 2. Verify Environment Variables

Pastikan `.env` di production server memiliki:

```env
NODE_ENV=production
APP_PORT=3006
APP_URL=https://api.yourdomain.com
FRONTEND_URLS=https://yourdomain.com,https://app.yourdomain.com
```

**PENTING:** 
- `APP_URL` harus sesuai dengan URL production Anda
- `FRONTEND_URLS` harus include semua frontend domains

### 3. Restart Service

```bash
# PM2
pm2 restart smart-e-arsip-api
pm2 logs smart-e-arsip-api

# Systemd
sudo systemctl restart smart-e-arsip-api
sudo systemctl status smart-e-arsip-api

# Docker
docker-compose restart api
docker-compose logs -f api

# Manual
pkill -f "node.*main"
npm run start:prod
```

### 4. Clear Browser Cache

**Important!** Browser might cache old CSP headers:

1. Open production Swagger: `https://api.yourdomain.com/api/docs`
2. Hard refresh: `Ctrl + Shift + R`
3. Or use Incognito: `Ctrl + Shift + N`
4. Check console (F12) for errors

---

## 🧪 Testing Production

### 1. Health Check

```bash
curl https://api.yourdomain.com/health
curl https://api.yourdomain.com/api/health
```

**Expected:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-23T18:23:46.315Z",
  "environment": "production",
  "version": "1.0.0"
}
```

### 2. Test Swagger UI

1. Open: `https://api.yourdomain.com/api/docs`
2. Open browser console (F12)
3. Check for CSP errors - **should be NONE**
4. Test login endpoint

### 3. Test Login

In Swagger UI:
1. Expand `POST /api/auth/login`
2. Click "Try it out"
3. Enter credentials:
   ```json
   {
     "username": "ahda.admin",
     "password": "Password123!"
   }
   ```
4. Click "Execute"

**Expected:** Status 200 with access_token ✅

---

## 🔍 Debugging Production

### Check Logs

**PM2:**
```bash
pm2 logs smart-e-arsip-api --lines 100
```

**Systemd:**
```bash
sudo journalctl -u smart-e-arsip-api -f
```

**Docker:**
```bash
docker-compose logs -f api
```

**Winston Logs:**
```bash
tail -f logs/combined.log
tail -f logs/error.log
```

### Check Environment

```bash
# Check if APP_URL is set correctly
cat .env | grep APP_URL

# Check running process
ps aux | grep node

# Check port binding
netstat -tlnp | grep 3006
```

### Test with cURL

```bash
# Test direct API call (bypass browser)
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"ahda.admin","password":"Password123!"}'
```

If cURL works but Swagger doesn't:
- Browser cache issue
- CSP still cached by browser
- Try different browser or incognito

---

## 🌐 CORS & CSP Configuration

### Environment Variables Needed

```env
# Required
NODE_ENV=production
APP_PORT=3006
APP_URL=https://api.yourdomain.com

# Frontend URLs (comma-separated)
FRONTEND_URLS=https://yourdomain.com,https://app.yourdomain.com

# Optional
JWT_SECRET=your-secret-key
REDIS_HOST=localhost
DATABASE_URL=mysql://...
```

### CSP Headers Sent

```
Content-Security-Policy: 
  default-src 'self';
  style-src 'self' 'unsafe-inline';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  img-src 'self' data: https:;
  connect-src 'self' https://api.yourdomain.com https://yourdomain.com https://app.yourdomain.com https://www.google-analytics.com;
```

### CORS Headers Sent

```
Access-Control-Allow-Origin: https://yourdomain.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
```

---

## 🚨 Common Production Issues

### Issue 1: CSP Still Blocking

**Symptoms:** Same error after deployment

**Solutions:**
1. Verify build was successful: `ls -la dist/`
2. Verify service restarted: `pm2 status`
3. Hard refresh browser: `Ctrl + Shift + R`
4. Clear ALL browser data: `Ctrl + Shift + Delete`
5. Try incognito mode

### Issue 2: Wrong APP_URL

**Symptoms:** CSP allows localhost but not production domain

**Solution:**
```bash
# Check .env
echo $APP_URL  # Should be production URL

# Update .env
APP_URL=https://api.yourdomain.com

# Restart
pm2 restart smart-e-arsip-api
```

### Issue 3: Frontend URL Not Allowed

**Symptoms:** CORS error from frontend

**Solution:**
```bash
# Add all frontend domains to .env
FRONTEND_URLS=https://yourdomain.com,https://app.yourdomain.com,https://www.yourdomain.com

# Restart
pm2 restart smart-e-arsip-api
```

### Issue 4: nginx Blocking Requests

**Symptoms:** 502 Bad Gateway or timeout

**Solution:**
Check nginx configuration:
```bash
# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Check logs
sudo tail -f /var/log/nginx/error.log
```

Nginx config should have:
```nginx
location /api {
    proxy_pass http://localhost:3006;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Add CORS headers if needed
    add_header 'Access-Control-Allow-Origin' '*' always;
}
```

---

## 📋 Deployment Checklist

Before deploying:

- [ ] Code updated in repository
- [ ] Build successful locally
- [ ] `.env` configured correctly for production
- [ ] APP_URL set to production domain
- [ ] FRONTEND_URLS includes all frontend domains
- [ ] Backup current production code
- [ ] Plan rollback strategy

After deploying:

- [ ] Service restarted successfully
- [ ] Health check responds: `/health`
- [ ] Swagger UI loads without errors
- [ ] No CSP errors in browser console
- [ ] Login works in Swagger UI
- [ ] Frontend can connect to API
- [ ] No CORS errors from frontend
- [ ] Check logs for errors

---

## 🔄 Rollback Plan

If deployment fails:

### Quick Rollback

```bash
# Git rollback
git reset --hard HEAD~1
npm run build
pm2 restart smart-e-arsip-api

# Or restore from backup
cp -r backup/dist/* dist/
pm2 restart smart-e-arsip-api
```

### Full Rollback

```bash
# Restore entire codebase
rm -rf /path/to/smart-e-arsip-api
cp -r backup/smart-e-arsip-api /path/to/
cd /path/to/smart-e-arsip-api
npm install
npm run build
pm2 restart smart-e-arsip-api
```

---

## 🎯 Quick Reference

### Deploy Commands

```bash
# Full deployment
git pull origin main
npm install
npm run build
pm2 restart smart-e-arsip-api

# Quick update (code only)
git pull origin main
npm run build
pm2 restart smart-e-arsip-api

# Emergency restart
pm2 restart smart-e-arsip-api
```

### Test Commands

```bash
# Health check
curl https://api.yourdomain.com/health

# Test login
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"ahda.admin","password":"Password123!"}'

# Check logs
pm2 logs smart-e-arsip-api --lines 50
```

### Debug Commands

```bash
# Check process
pm2 status
pm2 describe smart-e-arsip-api

# Check environment
pm2 env 0

# Monitor
pm2 monit
```

---

## 📚 Related Files

- `src/main.ts` - Main configuration file (CSP & CORS)
- `.env` - Environment variables
- `TROUBLESHOOTING.md` - General troubleshooting
- `PRODUCTION_ERROR_FIX.md` - Quick fixes

---

## ✅ Success Indicators

Production is working when:

1. ✅ Health check responds with 200 OK
2. ✅ Swagger UI loads at `/api/docs`
3. ✅ No CSP errors in browser console
4. ✅ No CORS errors in browser console
5. ✅ Login works in Swagger
6. ✅ Frontend can connect and authenticate
7. ✅ No errors in server logs

---

**Last Updated:** 2025-10-23T18:23:46.315Z
**Status:** ✅ READY FOR PRODUCTION DEPLOYMENT
