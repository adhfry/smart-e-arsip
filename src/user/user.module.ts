import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CacheLoggingInterceptor } from '../common/interceptors/cache-logging.interceptor';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheLoggingInterceptor,
    },
  ],
  exports: [UserService],
})
export class UserModule {}
