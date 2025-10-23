import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { User, Role } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

type UserWithoutPassword = Omit<User, 'password'>;

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly CACHE_PREFIX = 'user:';
  private readonly CACHE_LIST_PREFIX = 'users:list:';
  private readonly CACHE_TTL = 3600; // 1 jam dalam detik

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { username, email, phone, password, ...rest } = createUserDto;

    // Cek duplikasi username
    const existingUsername = await this.prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      throw new ConflictException('Username sudah digunakan');
    }

    // Cek duplikasi email
    if (email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existingEmail) {
        throw new ConflictException('Email sudah digunakan');
      }
    }

    // Cek duplikasi phone
    if (phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone },
      });
      if (existingPhone) {
        throw new ConflictException('Nomor telepon sudah digunakan');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        username,
        email,
        phone,
        password: hashedPassword,
        ...rest,
      },
    });

    // Invalidate cache list setelah create
    await this.invalidateListCache();
    this.logger.log(`User created: ${user.username} (ID: ${user.id})`);

    return user;
  }

  async findAll(role?: Role, isActive?: boolean): Promise<UserWithoutPassword[]> {
    // Generate cache key berdasarkan filter
    const cacheKey = `${this.CACHE_LIST_PREFIX}${role || 'all'}:${isActive !== undefined ? isActive : 'all'}`;

    // Cek cache terlebih dahulu
    const cached = await this.cacheManager.get<UserWithoutPassword[]>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT for users list: ${cacheKey}`);
      return cached;
    }

    this.logger.debug(`Cache MISS for users list: ${cacheKey}`);

    const where: any = {};
    
    if (role) {
      where.role = role;
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        nama_lengkap: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        password: false,
      },
      orderBy: { createdAt: 'desc' },
    }) as UserWithoutPassword[];

    // Simpan ke cache
    await this.cacheManager.set(cacheKey, users, this.CACHE_TTL);
    this.logger.debug(`Cached users list: ${cacheKey}`);

    return users;
  }

  async findOne(id: number): Promise<UserWithoutPassword> {
    // Generate cache key untuk user individual
    const cacheKey = `${this.CACHE_PREFIX}${id}`;

    // Cek cache terlebih dahulu
    const cached = await this.cacheManager.get<UserWithoutPassword>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT for user: ${cacheKey}`);
      return cached;
    }

    this.logger.debug(`Cache MISS for user: ${cacheKey}`);

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        nama_lengkap: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        password: false,
      },
    });

    if (!user) {
      throw new NotFoundException(`User dengan ID ${id} tidak ditemukan`);
    }

    // Simpan ke cache
    await this.cacheManager.set(cacheKey, user, this.CACHE_TTL);
    this.logger.debug(`Cached user: ${cacheKey}`);

    return user as UserWithoutPassword;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserWithoutPassword> {
    await this.findOne(id);

    const { email, phone, ...rest } = updateUserDto;

    // Cek duplikasi email jika diubah
    if (email) {
      const existingEmail = await this.prisma.user.findFirst({
        where: { email, NOT: { id } },
      });
      if (existingEmail) {
        throw new ConflictException('Email sudah digunakan');
      }
    }

    // Cek duplikasi phone jika diubah
    if (phone) {
      const existingPhone = await this.prisma.user.findFirst({
        where: { phone, NOT: { id } },
      });
      if (existingPhone) {
        throw new ConflictException('Nomor telepon sudah digunakan');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { email, phone, ...rest },
      select: {
        id: true,
        nama_lengkap: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        password: false,
      },
    }) as UserWithoutPassword;

    // Invalidate cache setelah update
    await this.invalidateUserCache(id);
    await this.invalidateListCache();
    this.logger.log(`User updated: ${updatedUser.username} (ID: ${id})`);

    return updatedUser;
  }

  async changePassword(
    id: number,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User dengan ID ${id} tidak ditemukan`);
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Password lama tidak sesuai');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    this.logger.log(`Password changed for user: ${user.username} (ID: ${id})`);
  }

  async toggleActive(id: number): Promise<UserWithoutPassword> {
    const user = await this.findOne(id);

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        nama_lengkap: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        password: false,
      },
    }) as UserWithoutPassword;

    // Invalidate cache setelah toggle
    await this.invalidateUserCache(id);
    await this.invalidateListCache();
    this.logger.log(`User status toggled: ${updatedUser.username} (ID: ${id}) - Active: ${updatedUser.isActive}`);

    return updatedUser;
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);

    await this.prisma.user.delete({ where: { id } });

    // Invalidate cache setelah delete
    await this.invalidateUserCache(id);
    await this.invalidateListCache();
    this.logger.log(`User deleted: ID ${id}`);
  }

  // Helper methods untuk cache invalidation
  private async invalidateUserCache(id: number): Promise<void> {
    const cacheKey = `${this.CACHE_PREFIX}${id}`;
    await this.cacheManager.del(cacheKey);
    this.logger.debug(`Invalidated cache: ${cacheKey}`);
  }

  private async invalidateListCache(): Promise<void> {
    // Invalidate semua cache list dengan pattern
    const keys = await this.getCacheKeys(`${this.CACHE_LIST_PREFIX}*`);
    for (const key of keys) {
      await this.cacheManager.del(key);
      this.logger.debug(`Invalidated cache: ${key}`);
    }
  }

  private async getCacheKeys(pattern: string): Promise<string[]> {
    // Simple implementation - in production, use Redis SCAN
    const keys: string[] = [];
    // For cache-manager-redis-store, we need to get all possible combinations
    const roles = ['all', 'admin', 'staf_tu', 'pimpinan', 'staf_bidang'];
    const activeStatus = ['all', 'true', 'false'];
    
    for (const role of roles) {
      for (const status of activeStatus) {
        keys.push(`${this.CACHE_LIST_PREFIX}${role}:${status}`);
      }
    }
    
    return keys;
  }

  // Method untuk statistik users
  async getUserStats(): Promise<{
    total: number;
    byRole: Record<Role, number>;
    active: number;
    inactive: number;
  }> {
    const cacheKey = 'user:stats';
    
    // Cek cache
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT for user stats`);
      return cached;
    }

    this.logger.debug(`Cache MISS for user stats`);

    const [total, active, inactive, byRole] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { isActive: false } }),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),
    ]);

    const stats = {
      total,
      active,
      inactive,
      byRole: byRole.reduce((acc, item) => {
        acc[item.role] = item._count.role;
        return acc;
      }, {} as Record<Role, number>),
    };

    // Cache untuk 5 menit
    await this.cacheManager.set(cacheKey, stats, 300);
    
    return stats;
  }

  // Method untuk mendapatkan user berdasarkan role
  async getUsersByRole(role: Role): Promise<UserWithoutPassword[]> {
    return this.findAll(role);
  }

  // Method untuk search users
  async searchUsers(searchTerm: string): Promise<UserWithoutPassword[]> {
    const cacheKey = `user:search:${searchTerm.toLowerCase()}`;
    
    // Cek cache
    const cached = await this.cacheManager.get<UserWithoutPassword[]>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT for user search: ${searchTerm}`);
      return cached;
    }

    this.logger.debug(`Cache MISS for user search: ${searchTerm}`);

    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { nama_lengkap: { contains: searchTerm } },
          { username: { contains: searchTerm } },
          { email: { contains: searchTerm } },
          { phone: { contains: searchTerm } },
        ],
      },
      select: {
        id: true,
        nama_lengkap: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        password: false,
      },
      orderBy: { nama_lengkap: 'asc' },
    }) as UserWithoutPassword[];

    // Cache hasil search untuk 10 menit
    await this.cacheManager.set(cacheKey, users, 600);
    
    return users;
  }
}
