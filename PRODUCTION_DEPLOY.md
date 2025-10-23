# 🚀 Production Deployment - Quick Guide

## 🚨 Current Issue

**Swagger UI production masih request ke `localhost:3006` instead of production URL!**

**Root Cause:** Production server running **OLD CODE**

---

## ✅ Quick Deployment (Copy & Paste)

### Step 1: SSH to Production Server

```bash
ssh user@your-server
cd /root/smart-e-arsip-api  # or your actual path
```

### Step 2: Run Deployment Script

```bash
# Download and run deployment script
curl -O https://raw.githubusercontent.com/your-repo/smart-e-arsip-api/main/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

**OR** manual deployment:

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build
npm run build

# Restart PM2
pm2 restart smart-e-arsip-api

# Check logs
pm2 logs smart-e-arsip-api --lines 50
```

### Step 3: Verify .env Production

```bash
nano .env
```

**MUST have these values:**

```env
NODE_ENV=production
APP_PORT=3006
APP_URL=https://api.smart-e-arsip.agribunker.id
FRONTEND_URLS=https://smart-e-arsip.agribunker.id
SESSION_DOMAIN=.smart-e-arsip.agribunker.id
```

**Save:** `Ctrl+O`, `Enter`, `Ctrl+X`

If you changed .env, restart again:

```bash
pm2 restart smart-e-arsip-api
```

### Step 4: Verify Deployment

```bash
# Check PM2 status
pm2 status

# Check environment variables
pm2 env smart-e-arsip-api | grep -E 'APP_URL|FRONTEND_URLS|NODE_ENV'

# Should output:
# NODE_ENV: production
# APP_URL: https://api.smart-e-arsip.agribunker.id
# FRONTEND_URLS: https://smart-e-arsip.agribunker.id
```

### Step 5: Check Logs

```bash
pm2 logs smart-e-arsip-api --lines 50
```

**Look for:**
- ✅ `Helmet disabled - configure security headers in nginx`
- ✅ `Application is running on: http://[::1]:3006`
- ❌ NO error messages

---

## 🌐 Test in Browser

### 1. Clear Browser Cache

Press: `Ctrl + Shift + Delete` → Clear all cache

### 2. Open Swagger UI

```
https://api.smart-e-arsip.agribunker.id/api-docs
```

### 3. Open Developer Console

Press `F12` → Console tab

### 4. Test Login

1. Expand: **Auth** → **POST /api/auth/login**
2. Click: **Try it out**
3. Input:
   ```json
   {
     "username": "ahda.admin",
     "password": "Password123!"
   }
   ```
4. Click: **Execute**

### 5. Verify Request URL

Open **Network tab** (F12):

✅ **CORRECT:** `https://api.smart-e-arsip.agribunker.id/api/auth/login`  
❌ **WRONG:** `http://localhost:3006/api/auth/login`

### 6. Check Console

❌ **Should NOT see:**
- "Permintaan Cross-Origin Ditolak"
- "CORS policy blocked"
- "NetworkError when attempting to fetch"

✅ **Should see:**
- Request successful
- Status: 200
- Response with JWT tokens

---

## 🔍 Troubleshooting

### Issue 1: Still Requesting to localhost

**Cause:** Code not deployed or .env wrong

**Solution:**
```bash
# Verify APP_URL
pm2 env smart-e-arsip-api | grep APP_URL

# If wrong, edit .env:
nano .env
# Set: APP_URL=https://api.smart-e-arsip.agribunker.id

# Restart:
pm2 restart smart-e-arsip-api
```

### Issue 2: CORS Error in Browser

**Cause:** FRONTEND_URLS not set correctly

**Solution:**
```bash
nano .env
# Set: FRONTEND_URLS=https://smart-e-arsip.agribunker.id

pm2 restart smart-e-arsip-api
```

### Issue 3: 404 Not Found

**Cause:** Code not built properly

**Solution:**
```bash
npm run build
pm2 restart smart-e-arsip-api
```

### Issue 4: PM2 Process Crashed

**Check logs:**
```bash
pm2 logs smart-e-arsip-api --lines 100
```

**Common causes:**
- Database connection failed
- Redis connection failed
- Port already in use

**Solution:**
```bash
# Check if port 3006 is free
netstat -tulpn | grep 3006

# Kill if needed
kill -9 $(lsof -t -i:3006)

# Restart
pm2 restart smart-e-arsip-api
```

---

## ✅ Success Checklist

After deployment, verify:

- [ ] Server running: `pm2 status`
- [ ] Logs clean: `pm2 logs smart-e-arsip-api`
- [ ] .env correct: `pm2 env smart-e-arsip-api`
- [ ] Swagger loads: https://api.smart-e-arsip.agribunker.id/api-docs
- [ ] Request to production URL (not localhost)
- [ ] NO CORS errors in console
- [ ] Login works in Swagger
- [ ] Can authorize with token

---

## 📊 Compare: NaviGo vs Smart E-Arsip

### NaviGo API (Working ✅)

**.env:**
```env
APP_URL=https://api.navigo.agribunker.id
FRONTEND_URLS=https://navigo.agribunker.id
```

**Swagger requests to:**
```
https://api.navigo.agribunker.id/api/...
```

### Smart E-Arsip (Should Be Same)

**.env:**
```env
APP_URL=https://api.smart-e-arsip.agribunker.id
FRONTEND_URLS=https://smart-e-arsip.agribunker.id
```

**Swagger should request to:**
```
https://api.smart-e-arsip.agribunker.id/api/...
```

---

## 🔐 Security Note

Helmet is **disabled** to allow Swagger UI to work.

Add security headers in **nginx** instead:

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
```

**Do NOT add CSP header** - it will block Swagger UI!

---

## 📚 Related Files

- `deploy.sh` - Automated deployment script
- `CORS_FIX_FINAL.md` - CORS fix explanation
- `.env.production` - Production environment template
- `TROUBLESHOOTING.md` - General troubleshooting

---

**Last Updated:** 2025-10-23  
**Status:** Ready for deployment
