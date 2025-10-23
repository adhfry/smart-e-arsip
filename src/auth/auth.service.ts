import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';

export interface JwtPayload {
  sub: number;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: number;
    username: string;
    nama_lengkap: string;
    email: string | null;
    role: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly REFRESH_TOKEN_PREFIX = 'refresh_token:';
  private readonly SESSION_PREFIX = 'session:';
  private readonly BLACKLIST_PREFIX = 'blacklist:';
  private readonly USER_CREDENTIALS_PREFIX = 'user_credentials:';
  
  // Token expiration times
  private readonly ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
  private readonly REFRESH_TOKEN_EXPIRY = '7d'; // 7 days
  private readonly REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
  private readonly USER_CREDENTIALS_TTL = 30 * 60; // 30 minutes - cache user for faster login

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private userService: UserService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async register(data: {
    nama_lengkap: string;
    username: string;
    email?: string;
    phone?: string;
    password: string;
    role?: string;
  }): Promise<LoginResponse> {
    // Cek username sudah ada
    const existingUser = await this.userService.findByUsername(data.username);
    if (existingUser) {
      throw new ConflictException('Username sudah digunakan');
    }

    // Cek email jika ada
    if (data.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingEmail) {
        throw new ConflictException('Email sudah digunakan');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        nama_lengkap: data.nama_lengkap,
        username: data.username,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        role: (data.role as any) || 'staf_bidang', // Default role
        isActive: true,
      },
    });

    this.logger.log(`New user registered: ${user.username} (ID: ${user.id})`);

    // Auto login after registration
    return this.generateTokens(user);
  }

  /**
   * 🔐 Login dengan Redis Caching
   * 
   * Cache Strategy:
   * 1. Cache user credentials untuk mempercepat login berikutnya (30 menit)
   * 2. Cache refresh token (7 hari)
   * 3. Cache session info (7 hari)
   * 
   * Flow:
   * 1. Cek cache untuk user credentials
   * 2. Jika cache hit → langsung verify password (FAST!)
   * 3. Jika cache miss → fetch dari database → cache untuk next time
   * 4. Generate tokens dan simpan di Redis
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    // ⚡ Try to get user from cache first
    let user: any = await this.cacheManager.get(
      `${this.USER_CREDENTIALS_PREFIX}${username}`,
    );
    
    if (!user) {
      // 🔍 Cache miss - fetch from database
      user = await this.userService.findByUsername(username);
      
      if (!user) {
        throw new UnauthorizedException('Username atau password salah');
      }

      // 💾 Cache user credentials for next login (30 minutes)
      await this.cacheManager.set(
        `${this.USER_CREDENTIALS_PREFIX}${username}`,
        user,
        this.USER_CREDENTIALS_TTL,
      );
      
      this.logger.debug(`💾 User credentials cached: ${username}`);
    } else {
      this.logger.debug(`⚡ CACHE HIT - User credentials from Redis: ${username}`);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Akun Anda telah dinonaktifkan');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Username atau password salah');
    }

    this.logger.log(`User logged in: ${user.username} (ID: ${user.id})`);

    // Generate tokens
    return this.generateTokens(user);
  }

  async logout(userId: number, token: string): Promise<void> {
    try {
      // Get user to clear username cache
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { username: true },
      });

      // Decode token to get expiration
      const decoded = this.jwtService.decode(token) as JwtPayload;
      
      if (decoded && decoded.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        
        if (ttl > 0) {
          // Add token to blacklist
          await this.cacheManager.set(
            `${this.BLACKLIST_PREFIX}${token}`,
            'true',
            ttl,
          );
        }
      }

      // Remove refresh token from cache
      await this.cacheManager.del(`${this.REFRESH_TOKEN_PREFIX}${userId}`);
      
      // Remove session
      await this.cacheManager.del(`${this.SESSION_PREFIX}${userId}`);
      
      // 🗑️ Remove cached user credentials
      if (user) {
        await this.cacheManager.del(`${this.USER_CREDENTIALS_PREFIX}${user.username}`);
        this.logger.debug(`User credentials cache cleared: ${user.username}`);
      }

      this.logger.log(`User logged out: ID ${userId}`);
    } catch (error) {
      this.logger.error(`Logout error for user ${userId}:`, error);
      throw new BadRequestException('Logout gagal');
    }
  }

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken) as JwtPayload;
      
      // Check if refresh token exists in cache
      const cachedToken = await this.cacheManager.get(
        `${this.REFRESH_TOKEN_PREFIX}${payload.sub}`,
      );

      if (!cachedToken || cachedToken !== refreshToken) {
        throw new UnauthorizedException('Refresh token tidak valid');
      }

      // Get user
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User tidak ditemukan atau tidak aktif');
      }

      this.logger.log(`Token refreshed for user: ${user.username} (ID: ${user.id})`);

      // Generate new tokens
      return this.generateTokens(user);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Refresh token tidak valid atau expired');
    }
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.cacheManager.get(
        `${this.BLACKLIST_PREFIX}${token}`,
      );

      if (isBlacklisted) {
        return false;
      }

      // Verify token
      this.jwtService.verify(token);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 🎫 Generate JWT Tokens dan simpan di Redis
   * 
   * Redis Keys:
   * - refresh_token:{userId} → Refresh token untuk renewal
   * - session:{userId} → Session info untuk monitoring
   * 
   * TTL: 7 hari untuk kedua keys
   */
  private async generateTokens(user: any): Promise<LoginResponse> {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    // Generate access token
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
    });

    // Generate refresh token
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY,
    });

    // 💾 Store refresh token in Redis
    await this.cacheManager.set(
      `${this.REFRESH_TOKEN_PREFIX}${user.id}`,
      refreshToken,
      this.REFRESH_TOKEN_TTL,
    );

    // 💾 Store session info in Redis
    await this.cacheManager.set(
      `${this.SESSION_PREFIX}${user.id}`,
      {
        userId: user.id,
        username: user.username,
        role: user.role,
        loginAt: new Date().toISOString(),
      },
      this.REFRESH_TOKEN_TTL,
    );

    this.logger.debug(`🎫 Tokens generated & cached in Redis for user: ${user.username}`);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 900, // 15 minutes in seconds
      user: {
        id: user.id,
        username: user.username,
        nama_lengkap: user.nama_lengkap,
        email: user.email,
        role: user.role,
      },
    };
  }

  async getActiveSession(userId: number): Promise<any> {
    const session = await this.cacheManager.get(
      `${this.SESSION_PREFIX}${userId}`,
    );
    return session || null;
  }

  async revokeAllSessions(userId: number): Promise<void> {
    // Get user to clear username cache
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });

    // Remove refresh token
    await this.cacheManager.del(`${this.REFRESH_TOKEN_PREFIX}${userId}`);
    
    // Remove session
    await this.cacheManager.del(`${this.SESSION_PREFIX}${userId}`);
    
    // 🗑️ Remove cached user credentials
    if (user) {
      await this.cacheManager.del(`${this.USER_CREDENTIALS_PREFIX}${user.username}`);
    }
    
    this.logger.log(`All sessions revoked for user ID: ${userId}`);
  }

  /**
   * Clear cached user credentials (call this when user data changes)
   */
  async clearUserCache(username: string): Promise<void> {
    await this.cacheManager.del(`${this.USER_CREDENTIALS_PREFIX}${username}`);
    this.logger.debug(`User credentials cache cleared: ${username}`);
  }
}
