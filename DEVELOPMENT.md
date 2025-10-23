# Development Guide

Panduan lengkap untuk development Smart E-Arsip API.

**PENTING: Development TIDAK menggunakan Docker agar hot reload berfungsi dengan baik.**

## Prerequisites

- Node.js 18+
- MySQL 8.0+ (Install local atau gunakan XAMPP)
- Redis 7+ (Install local)
- Git

## Setup Development Environment

### 1. Install Dependencies

```bash
git clone <repository-url>
cd smart-e-arsip-api
npm install
```

### 2. Install MySQL & Redis Lokal

#### Windows:
- **MySQL:** Download dari https://dev.mysql.com/downloads/mysql/ atau gunakan XAMPP
- **Redis:** Download dari https://github.com/microsoftarchive/redis/releases

#### Mac:
```bash
brew install mysql redis
brew services start mysql
brew services start redis
```

#### Linux:
```bash
sudo apt install mysql-server redis-server
sudo systemctl start mysql redis
```

### 3. Environment Configuration

Buat file `.env` dari template:

```bash
cp .env.example .env
```

Konfigurasi untuk development lokal:

```env
# Database (Local MySQL)
DATABASE_URL="mysql://root:@localhost:3306/smart_e_arsip"

# Redis (Local Redis - tanpa password untuk development)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=dev_secret_key_change_in_production
JWT_REFRESH_SECRET=dev_refresh_secret_change_in_production

# App
APP_PORT=3005
NODE_ENV=development
```

### 4. Database Setup

Buat database dan jalankan migrations:

```bash
# Buat database (via MySQL CLI atau phpMyAdmin)
CREATE DATABASE smart_e_arsip;

# Jalankan migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Seed database dengan data awal
npx prisma db seed
```

### 5. Run Development Server dengan Hot Reload

```bash
npm run start:dev
```

Server akan berjalan di `http://localhost:3005` dengan hot reload aktif.
Setiap perubahan code akan otomatis restart server.

## Development Tools

### Prisma Studio (Database GUI)
```bash
npx prisma studio
```
Buka `http://localhost:5555` untuk melihat dan edit data.

### Testing
```bash
# Unit tests
npm run test

# E2E tests  
npm run test:e2e

# Test coverage
npm run test:cov

# Test watch mode
npm run test:watch
```

### Debugging

#### VS Code Debug Configuration
Tambahkan di `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug NestJS",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "start:debug"],
      "port": 9229,
      "restart": true,
      "console": "integratedTerminal"
    }
  ]
}
```

## Hot Reload

### Yang Otomatis Reload:
✅ Perubahan di folder `src/`
✅ Perubahan di controllers, services, modules
✅ Perubahan di DTOs, entities, interfaces
✅ Perubahan konfigurasi TypeScript

### Yang Perlu Manual Restart:
❌ Perubahan di `package.json` - run `npm install`
❌ Perubahan di `prisma/schema.prisma` - run `npx prisma generate`
❌ Perubahan di `.env` - restart server

## Tips Development

### Connect ke MySQL
```bash
# Via MySQL CLI
mysql -u root -p

# Via MySQL Workbench atau phpMyAdmin
Host: localhost
Port: 3306
User: root
Database: smart_e_arsip
```

### Connect ke Redis
Lihat [REDIS_CONNECTION.md](./REDIS_CONNECTION.md) untuk detail lengkap.

### View Logs
```bash
# Logs akan tersimpan di folder logs/
tail -f logs/error.log
tail -f logs/combined.log
```

## Troubleshooting

### Port 3005 sudah digunakan
```bash
# Windows: Cari process yang menggunakan port
netstat -ano | findstr :3005

# Kill process
taskkill /PID <PID> /F

# Atau ubah port di .env
APP_PORT=3006
```

### Database connection error
```bash
# Pastikan MySQL berjalan
# Windows: Check via Task Manager atau Services
# Mac/Linux: 
brew services list  # Mac
systemctl status mysql  # Linux

# Test koneksi
npx prisma db pull
```

### Redis connection error
```bash
# Pastikan Redis berjalan
# Test dengan:
redis-cli ping
# Seharusnya response: PONG
```

## Workflow Development

1. **Start MySQL & Redis** (pastikan berjalan di background)
2. **Run `npm run start:dev`** - Start development server
3. **Edit code** - Hot reload akan otomatis restart
4. **Test API** - Via Postman/Thunder Client/Browser
5. **Lihat logs** - Terminal atau file logs
6. **Debug** - Pakai VS Code debugger jika perlu

## Production Build Test

Test production build sebelum deploy:

```bash
# Build production
npm run build

# Run production mode
npm run start:prod
```

