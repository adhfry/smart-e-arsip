import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LoginResponseDto } from './dto/login-response.dto';

@ApiTags('🔐 Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: '📝 Register user baru',
    description: `
**Endpoint untuk registrasi user baru**

### 📋 Validasi:
- Username minimal 3 karakter (huruf kecil, angka, titik, underscore, dash)
- Password minimal 8 karakter (harus ada huruf besar, kecil, angka, simbol)
- Email format valid (opsional)
- Phone format Indonesia (opsional)

### 🎭 Role:
- Default: **staf_bidang**
- Dapat diisi saat register (tapi biasanya admin yang set role)

### ⚡ Cache Effect:
- User baru akan ter-cache setelah auto-login
- Refresh token disimpan di Redis (TTL: 7 hari)

### 🚀 Auto Login:
Setelah register berhasil, user langsung mendapat access_token & refresh_token

### 💡 Use Case:
1. User mengisi form registrasi
2. Backend validasi dan create user
3. User langsung login otomatis
4. Dapat langsung akses API dengan token
    `,
  })
  @ApiBody({
    type: RegisterDto,
    examples: {
      stafBidang: {
        summary: 'Register sebagai Staf Bidang',
        value: {
          nama_lengkap: 'Budi Santoso',
          username: 'budi.user',
          email: 'budi@smartearsip.id',
          phone: '081234567898',
          password: 'Password123!',
          role: 'staf_bidang',
        },
      },
      stafTU: {
        summary: 'Register sebagai Staf TU',
        value: {
          nama_lengkap: 'Dewi Sartika',
          username: 'dewi.tu',
          email: 'dewi@smartearsip.id',
          phone: '081234567899',
          password: 'SecurePass456!',
          role: 'staf_tu',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '✅ Registrasi berhasil (auto login)',
    type: LoginResponseDto,
    example: {
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      token_type: 'Bearer',
      expires_in: 900,
      user: {
        id: 8,
        username: 'budi.user',
        nama_lengkap: 'Budi Santoso',
        email: 'budi@smartearsip.id',
        role: 'staf_bidang',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '❌ Validasi gagal',
    example: {
      statusCode: 400,
      message: [
        'Password harus mengandung huruf besar, huruf kecil, angka, dan simbol',
      ],
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 409,
    description: '⚠️ Username/Email sudah digunakan',
    example: {
      statusCode: 409,
      message: 'Username sudah digunakan',
      error: 'Conflict',
    },
  })
  async register(@Body() registerDto: RegisterDto): Promise<LoginResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '🔑 Login user',
    description: `
**Endpoint untuk login dengan username & password**

### 🔐 Authentication Flow:
1. User input username & password
2. Backend verify credentials
3. Generate access_token (15 menit) & refresh_token (7 hari)
4. Tokens disimpan di Redis
5. User dapat akses API dengan Bearer token

### ⚡ Redis Caching:
- **Refresh Token**: Disimpan di Redis dengan key \`refresh_token:{userId}\`
- **Session**: Disimpan di Redis dengan key \`session:{userId}\`
- **TTL**: 7 hari (sama dengan refresh token)

### 🎯 Response:
- **access_token**: Untuk akses API (expire: 15 menit)
- **refresh_token**: Untuk generate access_token baru (expire: 7 hari)
- **user**: Info user yang login

### 💡 Testing:
Login dengan user yang sudah di-seed:
- Admin: ahda.admin / Password123!
- Staf TU: ammaru.tu / Password123!
- Pimpinan: mariana.pimpinan / Password123!
- Staf Bidang: suaidi.bidang / Password123!

### 📊 Monitoring:
Check logs untuk melihat login activity dan cache behavior.
    `,
  })
  @ApiBody({
    type: LoginDto,
    examples: {
      admin: {
        summary: 'Login sebagai Admin',
        value: {
          username: 'ahda.admin',
          password: 'Password123!',
        },
      },
      stafTU: {
        summary: 'Login sebagai Staf TU',
        value: {
          username: 'ammaru.tu',
          password: 'Password123!',
        },
      },
      pimpinan: {
        summary: 'Login sebagai Pimpinan',
        value: {
          username: 'mariana.pimpinan',
          password: 'Password123!',
        },
      },
      stafBidang: {
        summary: 'Login sebagai Staf Bidang',
        value: {
          username: 'suaidi.bidang',
          password: 'Password123!',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '✅ Login berhasil (🔐 Session created in Redis)',
    type: LoginResponseDto,
    example: {
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      token_type: 'Bearer',
      expires_in: 900,
      user: {
        id: 1,
        username: 'ahda.admin',
        nama_lengkap: 'Ahda Ahda',
        email: 'ahda@smartearsip.id',
        role: 'admin',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '❌ Username atau password salah / Akun tidak aktif',
    example: {
      statusCode: 401,
      message: 'Username atau password salah',
      error: 'Unauthorized',
    },
  })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto.username, loginDto.password);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '🚪 Logout user',
    description: `
**Endpoint untuk logout dan invalidate session**

### 🔐 Authorization:
- Memerlukan Bearer token (access_token dari login)

### ⚡ Redis Operations:
- Add access_token ke blacklist (TTL: sisa waktu token)
- Hapus refresh_token dari Redis
- Hapus session dari Redis

### 🔒 Token Blacklist:
Token yang di-logout akan masuk blacklist dan tidak bisa digunakan lagi,
meskipun belum expired.

### 💡 Best Practice:
Selalu logout saat user:
- Klik tombol logout di UI
- Session timeout
- Ganti device/browser

### 📊 Monitoring:
Check logs untuk melihat logout activity.
    `,
  })
  @ApiResponse({
    status: 204,
    description: '✅ Logout berhasil (🗑️ Session & tokens removed)',
  })
  @ApiResponse({
    status: 401,
    description: '❌ Token tidak valid',
  })
  async logout(@Request() req: any): Promise<void> {
    const token = req.headers.authorization?.replace('Bearer ', '');
    await this.authService.logout(req.user.id, token);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '🔄 Refresh access token',
    description: `
**Endpoint untuk mendapatkan access_token baru menggunakan refresh_token**

### 🔐 Token Refresh Flow:
1. Access token expired (setelah 15 menit)
2. Frontend kirim refresh_token
3. Backend verify refresh_token di Redis
4. Generate access_token & refresh_token baru
5. Update tokens di Redis

### ⚡ Redis Verification:
- Check refresh_token exists di Redis
- Verify token belum expired
- Verify user masih aktif

### 🎯 Use Case:
- Access token expired
- User masih aktif menggunakan aplikasi
- Tidak perlu login ulang

### ⏰ Token Lifetime:
- Access Token: 15 menit
- Refresh Token: 7 hari

### 💡 Implementation Tips:
Frontend should:
1. Intercept 401 responses
2. Try refresh token
3. Retry original request with new token
4. If refresh fails → redirect to login

### 📊 Monitoring:
Check logs untuk tracking token refresh frequency.
    `,
  })
  @ApiBody({
    type: RefreshTokenDto,
    examples: {
      example1: {
        summary: 'Refresh token request',
        value: {
          refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '✅ Token berhasil di-refresh (🔄 New tokens generated)',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '❌ Refresh token tidak valid atau expired',
    example: {
      statusCode: 401,
      message: 'Refresh token tidak valid atau expired',
      error: 'Unauthorized',
    },
  })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<LoginResponseDto> {
    return this.authService.refreshToken(refreshTokenDto.refresh_token);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '👤 Get current user info',
    description: `
**Endpoint untuk mendapatkan informasi user yang sedang login**

### 🔐 Authorization:
- Memerlukan Bearer token

### ⚡ Redis Cache:
- User info di-cache (dari User module)
- Fast response dengan Redis

### 🎯 Use Case:
- Cek user masih terautentikasi
- Load user profile di dashboard
- Verify token masih valid

### 💡 Testing:
1. Login dulu untuk dapat token
2. Copy access_token
3. Authorize di Swagger
4. Call endpoint ini
5. Lihat info user Anda

### 📊 Response:
Sama dengan user object dari GET /users/:id
    `,
  })
  @ApiResponse({
    status: 200,
    description: '✅ User info berhasil diambil',
    example: {
      id: 1,
      username: 'ahda.admin',
      nama_lengkap: 'Ahda Ahda',
      email: 'ahda@smartearsip.id',
      phone: '081234567891',
      role: 'admin',
      isActive: true,
      createdAt: '2025-10-23T10:00:00.000Z',
      updatedAt: '2025-10-23T10:00:00.000Z',
    },
  })
  @ApiResponse({
    status: 401,
    description: '❌ Token tidak valid',
  })
  async getMe(@Request() req: any) {
    const { password, ...user } = req.user;
    return user;
  }

  @Get('session')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '🕐 Get active session info',
    description: `
**Endpoint untuk melihat informasi session aktif dari Redis**

### 🔐 Authorization:
- Memerlukan Bearer token

### ⚡ Redis Data:
Menampilkan session info yang disimpan di Redis:
- User ID
- Username
- Role
- Login time

### 🎯 Use Case:
- Monitoring session aktif
- Debug token issues
- Check login time

### 📊 Cache Key:
\`session:{userId}\`

### 💡 Testing:
Login dulu, lalu call endpoint ini untuk lihat session Anda.
    `,
  })
  @ApiResponse({
    status: 200,
    description: '✅ Session info (dari Redis)',
    example: {
      userId: 1,
      username: 'ahda.admin',
      role: 'admin',
      loginAt: '2025-10-23T10:00:00.000Z',
    },
  })
  @ApiResponse({
    status: 401,
    description: '❌ Token tidak valid',
  })
  @ApiResponse({
    status: 404,
    description: '❌ Session tidak ditemukan di Redis',
  })
  async getSession(@Request() req: any) {
    const session = await this.authService.getActiveSession(req.user.id);
    
    if (!session) {
      return {
        message: 'Session tidak ditemukan di Redis',
        note: 'Mungkin session sudah expired atau user logout',
      };
    }
    
    return session;
  }
}

