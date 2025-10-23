# 🌱 Database Seeder - Kelompok Smart E-Arsip

## 📋 Overview

Database seeder untuk membuat user awal sistem Smart E-Arsip dengan data anggota kelompok.

## 👥 User Accounts Created

### 1. Admin
- **Nama**: Ahda Ahda
- **Username**: `ahda.admin`
- **Email**: ahda@smartearsip.id
- **Phone**: 081234567891
- **Role**: Admin
- **Password**: `Password123!`

### 2. Staf TU (Tata Usaha)
#### Ammaru
- **Username**: `ammaru.tu`
- **Email**: ammaru@smartearsip.id
- **Phone**: 081234567892
- **Role**: Staf TU
- **Password**: `Password123!`

#### Kholifah
- **Username**: `kholifah.tu`
- **Email**: kholifah@smartearsip.id
- **Phone**: 081234567893
- **Role**: Staf TU
- **Password**: `Password123!`

### 3. Pimpinan (Kepala/Camat)
- **Nama**: Mariana Herawan
- **Username**: `mariana.pimpinan`
- **Email**: mariana@smartearsip.id
- **Phone**: 081234567894
- **Role**: Pimpinan
- **Password**: `Password123!`

### 4. Staf Bidang
#### Suaidi Ali
- **Username**: `suaidi.bidang`
- **Email**: suaidi@smartearsip.id
- **Phone**: 081234567895
- **Role**: Staf Bidang
- **Password**: `Password123!`

#### Pia
- **Username**: `pia.bidang`
- **Email**: pia@smartearsip.id
- **Phone**: 081234567896
- **Role**: Staf Bidang
- **Password**: `Password123!`

#### Safitorulhaniyah
- **Username**: `safitorul.bidang`
- **Email**: safitorul@smartearsip.id
- **Phone**: 081234567897
- **Role**: Staf Bidang
- **Password**: `Password123!`

---

## 🚀 How to Run

### Method 1: Using Prisma Seed Command
```bash
npx prisma db seed
```

### Method 2: Direct Node Execution
```bash
# Compile TypeScript first
npx tsc prisma/seed.ts --skipLibCheck --esModuleInterop --resolveJsonModule --module commonjs --target es2020

# Run compiled JavaScript
node prisma/seed.js
```

### Method 3: As Part of Migration
```bash
# Reset database and seed
npx prisma migrate reset

# Or fresh migrate with seed
npx prisma migrate dev --name init
```

---

## 📊 Seeding Results

After successful seeding, you'll see:

```
╔═══════════════════════════════════════════════════════════════╗
║                    SEEDING COMPLETED! ✅                      ║
╠═══════════════════════════════════════════════════════════════╣
║  Total Users:      7                                          ║
║  Admin:            1                                          ║
║  Staf TU:          2                                          ║
║  Pimpinan:         1                                          ║
║  Staf Bidang:      3                                          ║
╠═══════════════════════════════════════════════════════════════╣
║  Default Password: Password123!                               ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## 🧪 Testing Login

### Using Swagger UI

1. Go to: `http://localhost:3006/api/docs`
2. Find **POST /api/auth/login** endpoint
3. Click "Try it out"
4. Test with any user:

#### Test as Admin (Full Access)
```json
{
  "username": "ahda.admin",
  "password": "Password123!"
}
```

#### Test as Staf TU (Upload & Manage Surat)
```json
{
  "username": "ammaru.tu",
  "password": "Password123!"
}
```

#### Test as Pimpinan (Disposisi)
```json
{
  "username": "mariana.pimpinan",
  "password": "Password123!"
}
```

#### Test as Staf Bidang (Receive Disposisi)
```json
{
  "username": "suaidi.bidang",
  "password": "Password123!"
}
```

### Using cURL

```bash
# Login as Admin
curl -X POST http://localhost:3006/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"ahda.admin","password":"Password123!"}'

# Copy the access_token from response
# Use it for authenticated requests:
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3006/api/users
```

---

## 🎭 Role Permissions

### Admin (`ahda.admin`)
✅ Full system access
✅ Create/Update/Delete users
✅ View all data
✅ System configuration

### Staf TU (`ammaru.tu`, `kholifah.tu`)
✅ Upload surat masuk
✅ Validate AI results
✅ Create surat keluar
✅ Manage archives
❌ Cannot delete users

### Pimpinan (`mariana.pimpinan`)
✅ View all surat masuk
✅ Read AI summaries
✅ Create disposisi
✅ Assign to staf bidang
❌ Cannot upload surat

### Staf Bidang (`suaidi.bidang`, `pia.bidang`, `safitorul.bidang`)
✅ View assigned disposisi
✅ Update disposisi status
✅ View related surat
❌ Cannot create disposisi

---

## 🔄 Re-running Seeder

The seeder uses `upsert`, so it's **safe to run multiple times**:
- Existing users will be updated
- New users will be created
- No duplicate entries

```bash
npx prisma db seed
```

---

## 🔐 Changing Default Password

To change passwords after seeding:

### Option 1: Through API
```bash
curl -X PATCH http://localhost:3006/api/users/1/change-password \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "Password123!",
    "newPassword": "YourNewSecurePassword!"
  }'
```

### Option 2: Through Swagger UI
1. Login as the user
2. Go to `PATCH /users/{id}/change-password`
3. Enter old and new password
4. Execute

### Option 3: Modify Seeder
Edit `prisma/seed.ts` and change the password:
```typescript
const defaultPassword = await bcrypt.hash('YourNewPassword!', 10);
```

Then run: `npx prisma db seed`

---

## 📝 Adding More Users

Edit `prisma/seed.ts` and add to the `users` array:

```typescript
{
  nama_lengkap: 'New User Name',
  username: 'new.username',
  email: 'newuser@smartearsip.id',
  phone: '081234567898',
  password: defaultPassword,
  role: Role.staf_bidang, // or admin, staf_tu, pimpinan
  isActive: true,
}
```

Then run: `npx prisma db seed`

---

## 🗄️ Database Reset (Caution!)

If you want to completely reset database and re-seed:

```bash
# WARNING: This will DELETE ALL DATA!
npx prisma migrate reset

# Or manually:
npx prisma migrate dev --name reset
npx prisma db seed
```

---

## ✅ Verification

Check if users are created:

### Using Prisma Studio
```bash
npx prisma studio
```
Navigate to `users` table and verify all 7 users exist.

### Using API (requires login)
```bash
# Login first
TOKEN=$(curl -s -X POST http://localhost:3006/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"ahda.admin","password":"Password123!"}' \
  | jq -r '.access_token')

# Get all users
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3006/api/users
```

### Using MySQL CLI
```bash
mysql -u root -p smart_e_arsip

SELECT id, nama_lengkap, username, role FROM users;
```

Expected output:
```
+----+---------------------+--------------------+--------------+
| id | nama_lengkap        | username           | role         |
+----+---------------------+--------------------+--------------+
|  1 | Ahda Ahda           | ahda.admin         | admin        |
|  2 | Ammaru              | ammaru.tu          | staf_tu      |
|  3 | Kholifah            | kholifah.tu        | staf_tu      |
|  4 | Mariana Herawan     | mariana.pimpinan   | pimpinan     |
|  5 | Suaidi Ali          | suaidi.bidang      | staf_bidang  |
|  6 | Pia                 | pia.bidang         | staf_bidang  |
|  7 | Safitorulhaniyah    | safitorul.bidang   | staf_bidang  |
+----+---------------------+--------------------+--------------+
```

---

## 🎯 Quick Start Testing Workflow

1. **Seed database**:
   ```bash
   npx prisma db seed
   ```

2. **Start server**:
   ```bash
   npm run start:dev
   ```

3. **Open Swagger**:
   ```
   http://localhost:3006/api/docs
   ```

4. **Login as Admin**:
   - Username: `ahda.admin`
   - Password: `Password123!`

5. **Copy token and authorize** in Swagger

6. **Test endpoints**:
   - GET /users → See all 7 users
   - GET /users/stats → See breakdown by role
   - GET /users/1 → See Ahda's profile

7. **Test other roles** by logging in with different users

---

## 🆘 Troubleshooting

### Issue: "User already exists"
This is normal! Seeder uses `upsert` which updates existing users.

### Issue: "Cannot connect to database"
Check:
```bash
# Verify database is running
mysql -u root -p

# Check .env DATABASE_URL
cat .env | grep DATABASE_URL
```

### Issue: "bcrypt error"
Reinstall bcrypt:
```bash
npm rebuild bcrypt
```

### Issue: Password not working
Ensure you're using exactly: `Password123!` (case-sensitive)

---

## 📚 Related Documentation

- [USER_API_CACHE.md](../USER_API_CACHE.md) - User API documentation
- [TESTING_GUIDE.md](../TESTING_GUIDE.md) - Testing instructions
- [QUICK_COMMANDS.md](../QUICK_COMMANDS.md) - Quick reference

---

## 🎉 Summary

✅ **7 users created** for Kelompok Smart E-Arsip
✅ **All roles covered**: Admin, Staf TU, Pimpinan, Staf Bidang
✅ **Default password**: `Password123!` (easy for development)
✅ **Safe to re-run**: Uses upsert to prevent duplicates
✅ **Ready to test**: Login and explore the API!

**Happy coding! 🚀**
