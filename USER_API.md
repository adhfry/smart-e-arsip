# User Management API Documentation

## Endpoints

### 1. Create User
**POST** `/api/users`

Membuat user baru dalam sistem.

**Request Body:**
```json
{
  "nama_lengkap": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "phone": "081234567890",
  "password": "StrongP@ssw0rd",
  "role": "staf_tu",
  "isActive": true
}
```

**Response (201):**
```json
{
  "id": 1,
  "nama_lengkap": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "phone": "081234567890",
  "role": "staf_tu",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Roles yang tersedia:**
- `admin` - Administrator sistem
- `staf_tu` - Staf Tata Usaha (mengelola surat)
- `pimpinan` - Pimpinan (memberikan disposisi)
- `staf_bidang` - Staf Bidang (menerima disposisi)

---

### 2. Get All Users
**GET** `/api/users`

Mendapatkan daftar semua user dengan filter opsional.

**Query Parameters:**
- `role` (optional) - Filter berdasarkan role
- `isActive` (optional) - Filter berdasarkan status aktif (true/false)

**Example:**
```
GET /api/users?role=staf_tu&isActive=true
```

**Response (200):**
```json
[
  {
    "id": 1,
    "nama_lengkap": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "phone": "081234567890",
    "role": "staf_tu",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 3. Get User by ID
**GET** `/api/users/:id`

Mendapatkan detail user berdasarkan ID.

**Example:**
```
GET /api/users/1
```

**Response (200):**
```json
{
  "id": 1,
  "nama_lengkap": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "phone": "081234567890",
  "role": "staf_tu",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 4. Update User
**PATCH** `/api/users/:id`

Mengupdate data user. Username dan password tidak bisa diubah melalui endpoint ini.

**Request Body:**
```json
{
  "nama_lengkap": "John Doe Updated",
  "email": "john.new@example.com",
  "phone": "081234567899",
  "role": "pimpinan",
  "isActive": true
}
```

**Response (200):**
```json
{
  "id": 1,
  "nama_lengkap": "John Doe Updated",
  "username": "johndoe",
  "email": "john.new@example.com",
  "phone": "081234567899",
  "role": "pimpinan",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

---

### 5. Change Password
**PATCH** `/api/users/:id/change-password`

Mengubah password user.

**Request Body:**
```json
{
  "oldPassword": "OldP@ssw0rd",
  "newPassword": "NewP@ssw0rd123"
}
```

**Response (204):**
No content - Password berhasil diubah

---

### 6. Toggle Active Status
**PATCH** `/api/users/:id/toggle-active`

Mengaktifkan atau menonaktifkan user.

**Response (200):**
```json
{
  "id": 1,
  "nama_lengkap": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "phone": "081234567890",
  "role": "staf_tu",
  "isActive": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

---

### 7. Delete User
**DELETE** `/api/users/:id`

Menghapus user dari sistem.

**Response (204):**
No content - User berhasil dihapus

---

## Validasi

### Username
- Minimal 3 karakter, maksimal 50 karakter
- Hanya boleh mengandung huruf, angka, dan underscore
- Harus unik

### Password
- Minimal 8 karakter
- Harus mengandung huruf besar, huruf kecil, dan angka

### Email
- Format email yang valid
- Harus unik (jika diisi)

### Phone
- Maksimal 15 karakter
- Hanya boleh mengandung angka, +, -, spasi, dan tanda kurung
- Harus unik (jika diisi)

### Nama Lengkap
- Maksimal 100 karakter

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": ["Password harus mengandung huruf besar, huruf kecil, dan angka"],
  "error": "Bad Request"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "User dengan ID 1 tidak ditemukan",
  "error": "Not Found"
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

## Testing dengan cURL

### Create User
```bash
curl -X POST http://localhost:3005/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "nama_lengkap": "Admin System",
    "username": "admin",
    "email": "admin@example.com",
    "password": "Admin123",
    "role": "admin"
  }'
```

### Get All Users
```bash
curl http://localhost:3005/api/users
```

### Get User by ID
```bash
curl http://localhost:3005/api/users/1
```

### Update User
```bash
curl -X PATCH http://localhost:3005/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "nama_lengkap": "Admin System Updated",
    "email": "admin.new@example.com"
  }'
```

### Change Password
```bash
curl -X PATCH http://localhost:3005/api/users/1/change-password \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "Admin123",
    "newPassword": "Admin123New"
  }'
```

### Toggle Active
```bash
curl -X PATCH http://localhost:3005/api/users/1/toggle-active
```

### Delete User
```bash
curl -X DELETE http://localhost:3005/api/users/1
```
