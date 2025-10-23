import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../common/services/cache.service';
import { User, Role } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

type UserWithoutPassword = Omit<User, 'password'>;

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  
  // 🚀 ULTRA-FAST CACHE KEYS & TTL
  private readonly CACHE_PREFIX = 'users:';
  private readonly CACHE_TTL = 0; // 0 = unlimited (manual invalidation untuk kecepatan maksimal!)

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
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
    await this.cacheService.invalidatePattern(`${this.CACHE_PREFIX}*`);
    this.logger.log(`User created: ${user.username} (ID: ${user.id})`);

    return user;
  }

  async findAll(role?: Role, isActive?: boolean): Promise<UserWithoutPassword[]> {
    const cacheKey = `${this.CACHE_PREFIX}list:${role || 'all'}:${isActive ?? 'all'}`;

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const where: any = {};
        
        if (role) where.role = role;
        if (isActive !== undefined) where.isActive = isActive;

        return this.prisma.user.findMany({
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
        }) as Promise<UserWithoutPassword[]>;
      },
      this.CACHE_TTL,
    );
  }

  async findOne(id: number): Promise<UserWithoutPassword> {
    const cacheKey = `${this.CACHE_PREFIX}${id}`;

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
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

        return user as UserWithoutPassword;
      },
      this.CACHE_TTL,
    );
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

    // Invalidate ALL user cache setelah update
    await this.cacheService.invalidatePattern(`${this.CACHE_PREFIX}*`);
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

    // ⚡ Clear ALL user cache after password change
    await this.cacheService.invalidatePattern(`${this.CACHE_PREFIX}*`);
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

    // Invalidate ALL user cache setelah toggle
    await this.cacheService.invalidatePattern(`${this.CACHE_PREFIX}*`);
    this.logger.log(`User status toggled: ${updatedUser.username} (ID: ${id}) - Active: ${updatedUser.isActive}`);

    return updatedUser;
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);

    await this.prisma.user.delete({ where: { id } });

    // Invalidate ALL user cache setelah delete
    await this.cacheService.invalidatePattern(`${this.CACHE_PREFIX}*`);
    this.logger.log(`User deleted: ID ${id}`);
  }

  // Method untuk statistik users
  async getUserStats(): Promise<{
    total: number;
    byRole: Record<Role, number>;
    active: number;
    inactive: number;
  }> {
    const cacheKey = `${this.CACHE_PREFIX}stats`;

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const [total, active, inactive, byRole] = await Promise.all([
          this.prisma.user.count(),
          this.prisma.user.count({ where: { isActive: true } }),
          this.prisma.user.count({ where: { isActive: false } }),
          this.prisma.user.groupBy({
            by: ['role'],
            _count: { role: true },
          }),
        ]);

        return {
          total,
          active,
          inactive,
          byRole: byRole.reduce((acc, item) => {
            acc[item.role] = item._count.role;
            return acc;
          }, {} as Record<Role, number>),
        };
      },
      this.CACHE_TTL,
    );
  }

  // Method untuk mendapatkan user berdasarkan role
  async getUsersByRole(role: Role): Promise<UserWithoutPassword[]> {
    return this.findAll(role);
  }

  // Method untuk search users
  async searchUsers(searchTerm: string): Promise<UserWithoutPassword[]> {
    const cacheKey = `${this.CACHE_PREFIX}search:${searchTerm.toLowerCase()}`;

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        return this.prisma.user.findMany({
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
        }) as Promise<UserWithoutPassword[]>;
      },
      this.CACHE_TTL,
    );
  }
}
