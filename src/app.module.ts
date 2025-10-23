import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import * as redisStore from 'cache-manager-redis-store';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { SuratMasukModule } from './surat-masuk/surat-masuk.module';
import { SuratKeluarModule } from './surat-keluar/surat-keluar.module';
import { DisposisiModule } from './disposisi/disposisi.module';
import { CacheModule } from '@nestjs/cache-manager';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './common/config/winston.config';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    WinstonModule.forRoot(winstonConfig),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get<string>('REDIS_HOST', 'localhost'),
        port: configService.get<number>('REDIS_PORT', 6379),
        password: configService.get<string>('REDIS_PASSWORD'),
        ttl: 0, // Default: unlimited (manual invalidation)
        max: 10000, // Max items in cache
        db: configService.get<number>('REDIS_DB', 0),
        // Performance tuning
        socket_keepalive: true,
        retry_strategy: () => 1000,
        enable_offline_queue: false,
      }),
    }),
    CommonModule,
    PrismaModule,
    AuthModule,
    UserModule,
    SuratMasukModule,
    SuratKeluarModule,
    DisposisiModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
