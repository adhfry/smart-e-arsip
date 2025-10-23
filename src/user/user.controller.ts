import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CacheInterceptor } from '@nestjs/cache-manager';

@ApiTags('👤 User Management')
@ApiExtraModels(UserResponseDto, CreateUserDto, UpdateUserDto, ChangePasswordDto)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '➕ Membuat user baru',
    description: `
**Endpoint untuk membuat user baru di sistem Smart E-Arsip**

### 🔐 Authorization
- Memerlukan token JWT Bearer
- Hanya Admin yang dapat mengakses endpoint ini

### 📋 Role yang tersedia:
- **admin**: Administrator sistem
- **staf_tu**: Staf Tata Usaha (mengelola surat masuk/keluar)
- **pimpinan**: Kepala/Camat (memberikan disposisi)
- **staf_bidang**: Pegawai bidang (menerima disposisi)

### ⚡ Cache Behavior:
- Setelah user dibuat, cache list akan di-invalidate
- User baru akan langsung tersedia di list tanpa delay

### 🎯 Use Case:
1. Admin login dan mendapat token
2. Admin membuat akun untuk Staf TU baru
3. Staf TU dapat langsung login dengan kredensial yang dibuat
    `
  })
  @ApiBody({ 
    type: CreateUserDto,
    description: 'Data user yang akan dibuat',
    examples: {
      admin: {
        summary: 'Contoh membuat Admin',
        value: {
          nama_lengkap: 'Ahmad Suryadi',
          username: 'admin.ahmad',
          email: 'ahmad@smartearsip.id',
          phone: '081234567890',
          password: 'Password123!',
          role: 'admin'
        }
      },
      staf_tu: {
        summary: 'Contoh membuat Staf TU',
        value: {
          nama_lengkap: 'Siti Aminah',
          username: 'tu.siti',
          email: 'siti@smartearsip.id',
          phone: '081234567891',
          password: 'Password123!',
          role: 'staf_tu'
        }
      },
      pimpinan: {
        summary: 'Contoh membuat Pimpinan',
        value: {
          nama_lengkap: 'Dr. Budi Santoso, M.Si',
          username: 'camat.budi',
          email: 'budi@smartearsip.id',
          phone: '081234567892',
          password: 'Password123!',
          role: 'pimpinan'
        }
      },
      staf_bidang: {
        summary: 'Contoh membuat Staf Bidang',
        value: {
          nama_lengkap: 'Rahmat Hidayat',
          username: 'bidang.rahmat',
          email: 'rahmat@smartearsip.id',
          phone: '081234567893',
          password: 'Password123!',
          role: 'staf_bidang'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: '✅ User berhasil dibuat (password tidak ditampilkan di response)',
    type: UserResponseDto,
    example: {
      id: 1,
      nama_lengkap: 'Ahmad Suryadi',
      username: 'admin.ahmad',
      email: 'ahmad@smartearsip.id',
      phone: '081234567890',
      role: 'admin',
      isActive: true,
      createdAt: '2025-10-23T10:00:00.000Z',
      updatedAt: '2025-10-23T10:00:00.000Z'
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: '❌ Bad Request - Data tidak valid',
    example: {
      statusCode: 400,
      message: [
        'username must be longer than or equal to 3 characters',
        'email must be an email',
        'password must be longer than or equal to 8 characters'
      ],
      error: 'Bad Request'
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: '🔒 Unauthorized - Token tidak valid atau tidak ada',
    example: {
      statusCode: 401,
      message: 'Unauthorized'
    }
  })
  @ApiResponse({ 
    status: 409, 
    description: '⚠️ Conflict - Username/Email/Phone sudah digunakan',
    example: {
      statusCode: 409,
      message: 'Username sudah digunakan',
      error: 'Conflict'
    }
  })
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto);
    const { password, ...result } = user;
    return result;
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '📋 Mendapatkan semua user dengan filter',
    description: `
**Endpoint untuk mendapatkan daftar user dengan filtering**

### 🔐 Authorization
- Memerlukan token JWT Bearer
- Semua role yang terautentikasi dapat mengakses

### ⚡ Redis Caching:
- **Cache Key Pattern**: \`users:list:{role}:{isActive}\`
- **TTL**: 1 jam (3600 detik)
- **Cache Strategy**: Query-based caching
- Setiap kombinasi filter memiliki cache terpisah
- Cache di-invalidate otomatis saat ada perubahan data user

### 🎯 Filter Parameters:
1. **role**: Filter berdasarkan role user
2. **isActive**: Filter berdasarkan status aktif user

### 📊 Cache Examples:
- \`users:list:all:all\` → Semua user
- \`users:list:admin:true\` → Admin yang aktif
- \`users:list:staf_tu:all\` → Semua staf TU

### 💡 Tips:
- Gunakan filter untuk mengurangi payload response
- Cache akan otomatis ter-refresh setelah 1 jam
- Response header akan menunjukkan apakah data dari cache atau database
    `
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: Role,
    description: '🎭 Filter berdasarkan role user',
    example: 'staf_tu'
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: '✅ Filter berdasarkan status aktif (true/false)',
    example: true
  })
  @ApiResponse({
    status: 200,
    description: '✅ Daftar user berhasil diambil (🚀 Cache: HIT atau ⏳ Cache: MISS - lihat logs)',
    type: [UserResponseDto],
    example: [
      {
        id: 1,
        nama_lengkap: 'Ahmad Suryadi',
        username: 'admin.ahmad',
        email: 'ahmad@smartearsip.id',
        phone: '081234567890',
        role: 'admin',
        isActive: true,
        createdAt: '2025-10-23T10:00:00.000Z',
        updatedAt: '2025-10-23T10:00:00.000Z'
      },
      {
        id: 2,
        nama_lengkap: 'Siti Aminah',
        username: 'tu.siti',
        email: 'siti@smartearsip.id',
        phone: '081234567891',
        role: 'staf_tu',
        isActive: true,
        createdAt: '2025-10-23T10:05:00.000Z',
        updatedAt: '2025-10-23T10:05:00.000Z'
      }
    ]
  })
  @ApiResponse({ 
    status: 401, 
    description: '🔒 Unauthorized - Token tidak valid',
    example: {
      statusCode: 401,
      message: 'Unauthorized'
    }
  })
  async findAll(
    @Query('role') role?: Role,
    @Query('isActive') isActive?: string,
  ) {
    const isActiveBoolean = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.userService.findAll(role, isActiveBoolean);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ 
    summary: '📊 Statistik User',
    description: `
**Endpoint untuk mendapatkan statistik user dalam sistem**

### 🔐 Authorization
- Memerlukan token JWT Bearer
- Biasanya untuk Admin/Pimpinan

### ⚡ Redis Caching:
- **Cache Key**: \`user:stats\`
- **TTL**: 5 menit (300 detik)
- Data statistik di-cache untuk mengurangi query database
- Ideal untuk dashboard monitoring

### 📈 Data yang dikembalikan:
- Total user
- User aktif
- User tidak aktif  
- Breakdown per role
    `
  })
  @ApiResponse({
    status: 200,
    description: '✅ Statistik user (🚀 Cached untuk performa optimal)',
    example: {
      total: 15,
      active: 12,
      inactive: 3,
      byRole: {
        admin: 2,
        staf_tu: 4,
        pimpinan: 3,
        staf_bidang: 6
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: '🔒 Unauthorized'
  })
  async getStats() {
    return this.userService.getUserStats();
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ 
    summary: '🔍 Search user',
    description: `
**Endpoint untuk mencari user berdasarkan nama, username, email, atau phone**

### 🔐 Authorization
- Memerlukan token JWT Bearer

### ⚡ Redis Caching:
- **Cache Key Pattern**: \`user:search:{searchTerm}\`
- **TTL**: 10 menit (600 detik)
- Search results di-cache untuk performa
- Ideal untuk autocomplete/typeahead

### 🔎 Pencarian:
- Mencari di field: nama_lengkap, username, email, phone
- Case-insensitive search
- Partial match (LIKE query)
    `
  })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: 'Kata kunci pencarian',
    example: 'ahmad'
  })
  @ApiResponse({
    status: 200,
    description: '✅ Hasil pencarian user (🚀 Cached)',
    type: [UserResponseDto],
  })
  @ApiResponse({ 
    status: 401, 
    description: '🔒 Unauthorized'
  })
  async search(@Query('q') searchTerm: string) {
    return this.userService.searchUsers(searchTerm);
  }

  @Get('by-role/:role')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ 
    summary: '🎭 Mendapatkan user berdasarkan role',
    description: `
**Endpoint khusus untuk mendapatkan user berdasarkan role tertentu**

### 🔐 Authorization
- Memerlukan token JWT Bearer

### ⚡ Redis Caching:
- Menggunakan cache yang sama dengan GET /users
- **Cache Key**: \`users:list:{role}:all\`
- **TTL**: 1 jam

### 🎯 Use Case:
- Mendapatkan daftar Pimpinan untuk disposisi
- Mendapatkan daftar Staf Bidang untuk assignment
- Dropdown/Select options di frontend
    `
  })
  @ApiParam({ 
    name: 'role', 
    enum: Role, 
    description: 'Role user yang akan diambil',
    example: 'staf_bidang'
  })
  @ApiResponse({
    status: 200,
    description: '✅ Daftar user dengan role tertentu (🚀 Cached)',
    type: [UserResponseDto],
  })
  @ApiResponse({ 
    status: 401, 
    description: '🔒 Unauthorized'
  })
  async getUsersByRole(@Param('role') role: Role) {
    return this.userService.getUsersByRole(role);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ 
    summary: '🔍 Mendapatkan detail user berdasarkan ID',
    description: `
**Endpoint untuk mendapatkan detail lengkap satu user**

### 🔐 Authorization
- Memerlukan token JWT Bearer

### ⚡ Redis Caching:
- **Cache Key Pattern**: \`user:{id}\`
- **TTL**: 1 jam (3600 detik)
- Individual user data di-cache
- Cache di-invalidate saat user update/delete

### 💡 Tips Testing Cache:
1. **First request**: Check logs → "Cache MISS for user:1"
2. **Second request**: Check logs → "Cache HIT for user:1"
3. Update user → Cache invalidated
4. **Next request**: Cache MISS lagi (fresh from DB)
    `
  })
  @ApiParam({ 
    name: 'id', 
    type: Number, 
    description: 'User ID',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: '✅ Detail user ditemukan (🚀 Cache: HIT atau ⏳ Cache: MISS)',
    type: UserResponseDto,
    example: {
      id: 1,
      nama_lengkap: 'Ahmad Suryadi',
      username: 'admin.ahmad',
      email: 'ahmad@smartearsip.id',
      phone: '081234567890',
      role: 'admin',
      isActive: true,
      createdAt: '2025-10-23T10:00:00.000Z',
      updatedAt: '2025-10-23T10:00:00.000Z'
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: '❌ User tidak ditemukan',
    example: {
      statusCode: 404,
      message: 'User dengan ID 999 tidak ditemukan',
      error: 'Not Found'
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: '🔒 Unauthorized'
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ 
    summary: '✏️ Mengupdate data user',
    description: `
**Endpoint untuk mengupdate data user**

### 🔐 Authorization
- Memerlukan token JWT Bearer
- Admin dapat update semua user
- User dapat update data diri sendiri

### ⚡ Cache Invalidation:
- Cache user individual (\`user:{id}\`) di-invalidate
- Cache list users di-invalidate semua kombinasi filter
- Memastikan data selalu konsisten

### 📝 Field yang dapat diupdate:
- nama_lengkap
- email (akan di-cek duplikasi)
- phone (akan di-cek duplikasi)
- role (hanya admin)
- isActive (hanya admin)

### ⚠️ Catatan:
- Username tidak dapat diubah
- Password diubah melalui endpoint terpisah
    `
  })
  @ApiParam({ 
    name: 'id', 
    type: Number, 
    description: 'User ID yang akan diupdate',
    example: 1
  })
  @ApiBody({
    type: UpdateUserDto,
    description: 'Data yang akan diupdate (semua field optional)',
    examples: {
      updateProfile: {
        summary: 'Update profil dasar',
        value: {
          nama_lengkap: 'Ahmad Suryadi (Updated)',
          email: 'ahmad.new@smartearsip.id',
          phone: '081234567899'
        }
      },
      updateRole: {
        summary: 'Update role (Admin only)',
        value: {
          role: 'pimpinan'
        }
      },
      deactivate: {
        summary: 'Nonaktifkan user (Admin only)',
        value: {
          isActive: false
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: '✅ User berhasil diupdate (🔄 Cache invalidated)',
    type: UserResponseDto,
    example: {
      id: 1,
      nama_lengkap: 'Ahmad Suryadi (Updated)',
      username: 'admin.ahmad',
      email: 'ahmad.new@smartearsip.id',
      phone: '081234567899',
      role: 'admin',
      isActive: true,
      createdAt: '2025-10-23T10:00:00.000Z',
      updatedAt: '2025-10-23T16:45:00.000Z'
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: '❌ User tidak ditemukan'
  })
  @ApiResponse({ 
    status: 409, 
    description: '⚠️ Email/Phone sudah digunakan user lain',
    example: {
      statusCode: 409,
      message: 'Email sudah digunakan',
      error: 'Conflict'
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: '🔒 Unauthorized'
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
  }

  @Patch(':id/change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: '🔐 Mengubah password user',
    description: `
**Endpoint untuk mengubah password user**

### 🔐 Authorization
- Memerlukan token JWT Bearer
- User hanya dapat mengubah password sendiri
- Admin dapat mengubah password semua user

### 🔒 Keamanan:
- Memerlukan password lama untuk validasi
- Password baru di-hash dengan bcrypt (cost: 10)
- Password lama di-compare dengan hash di database

### ⚡ Cache:
- Tidak mempengaruhi cache (password tidak di-cache)

### 💡 Best Practice:
- Password minimal 8 karakter
- Kombinasi huruf besar, kecil, angka, simbol
    `
  })
  @ApiParam({ 
    name: 'id', 
    type: Number, 
    description: 'User ID',
    example: 1
  })
  @ApiBody({
    type: ChangePasswordDto,
    description: 'Password lama dan baru',
    examples: {
      example1: {
        summary: 'Contoh perubahan password',
        value: {
          oldPassword: 'Password123!',
          newPassword: 'NewSecurePass456!'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 204, 
    description: '✅ Password berhasil diubah (No Content)'
  })
  @ApiResponse({ 
    status: 400, 
    description: '❌ Password lama tidak sesuai',
    example: {
      statusCode: 400,
      message: 'Password lama tidak sesuai',
      error: 'Bad Request'
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: '❌ User tidak ditemukan'
  })
  @ApiResponse({ 
    status: 401, 
    description: '🔒 Unauthorized'
  })
  async changePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.userService.changePassword(
      id,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword,
    );
  }

  @Patch(':id/toggle-active')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ 
    summary: '🔄 Toggle status aktif user',
    description: `
**Endpoint untuk mengaktifkan/menonaktifkan user**

### 🔐 Authorization
- Memerlukan token JWT Bearer
- Hanya Admin yang dapat mengakses

### ⚡ Cache Invalidation:
- Cache user individual di-invalidate
- Cache list users di-invalidate
- Status berubah real-time

### 🎯 Use Case:
- Menonaktifkan user sementara tanpa hapus data
- Mengaktifkan kembali user yang dinonaktifkan
- Audit trail tetap terjaga (soft disable)

### 💡 Tips:
- User nonaktif tidak dapat login
- Data user tetap tersimpan
- Dapat diaktifkan kembali kapan saja
    `
  })
  @ApiParam({ 
    name: 'id', 
    type: Number, 
    description: 'User ID',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: '✅ Status user berhasil diubah (🔄 Cache invalidated)',
    type: UserResponseDto,
    example: {
      id: 1,
      nama_lengkap: 'Ahmad Suryadi',
      username: 'admin.ahmad',
      email: 'ahmad@smartearsip.id',
      phone: '081234567890',
      role: 'admin',
      isActive: false,
      createdAt: '2025-10-23T10:00:00.000Z',
      updatedAt: '2025-10-23T16:50:00.000Z'
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: '❌ User tidak ditemukan'
  })
  @ApiResponse({ 
    status: 401, 
    description: '🔒 Unauthorized'
  })
  async toggleActive(@Param('id', ParseIntPipe) id: number) {
    return this.userService.toggleActive(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: '🗑️ Menghapus user (Permanent Delete)',
    description: `
**Endpoint untuk menghapus user secara permanen**

### 🔐 Authorization
- Memerlukan token JWT Bearer
- Hanya Admin yang dapat mengakses

### ⚠️ PERHATIAN:
- **PERMANENT DELETE** - Data tidak dapat dikembalikan
- Pertimbangkan gunakan toggle-active untuk soft delete
- Relasi dengan surat/disposisi akan terpengaruh

### ⚡ Cache Invalidation:
- Cache user individual di-invalidate
- Cache list users di-invalidate
- Cache stats di-invalidate

### 🎯 Rekomendasi:
- Gunakan \`PATCH /users/:id/toggle-active\` untuk deaktivasi
- Gunakan DELETE hanya jika benar-benar perlu menghapus data
- Backup data sebelum delete jika diperlukan
    `
  })
  @ApiParam({ 
    name: 'id', 
    type: Number, 
    description: 'User ID yang akan dihapus',
    example: 1
  })
  @ApiResponse({ 
    status: 204, 
    description: '✅ User berhasil dihapus (No Content - 🔄 Cache invalidated)'
  })
  @ApiResponse({ 
    status: 404, 
    description: '❌ User tidak ditemukan',
    example: {
      statusCode: 404,
      message: 'User dengan ID 999 tidak ditemukan',
      error: 'Not Found'
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: '🔒 Unauthorized'
  })
  @ApiResponse({ 
    status: 400, 
    description: '❌ Bad Request - User masih memiliki relasi dengan data lain',
    example: {
      statusCode: 400,
      message: 'Cannot delete user with existing relations',
      error: 'Bad Request'
    }
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.userService.remove(id);
  }
}
