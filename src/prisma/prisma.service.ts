import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(private configService: ConfigService) {
    super({
      log:
        configService.get('ENABLE_QUERY_LOGGING') === 'true'
          ? [
              { emit: 'event', level: 'query' },
              { emit: 'event', level: 'error' },
              { emit: 'event', level: 'warn' },
            ]
          : [{ emit: 'event', level: 'error' }],
      errorFormat: 'minimal',
    });
  }

  async onModuleInit() {
    this.$on('error' as never, (event: any) => {
      this.logger.error(`❌ Database Error: ${event.message}`);
    });

    this.$on('warn' as never, (event: any) => {
      this.logger.warn(`⚠️ Database Warning: ${event.message}`);
    });

    if (this.configService.get('ENABLE_QUERY_LOGGING') === 'true') {
      this.$on('query' as never, (event: any) => {
        if (event.duration > 1000) {
          this.logger.warn(
            `🐌 SLOW QUERY (${event.duration}ms): ${event.query}`,
          );
        }
      });
    }

    await this.$connect();
    this.logger.log('✅ Database connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('🔌 Database disconnected');
  }

  async cleanDatabase() {
    if (this.configService.get('NODE_ENV') === 'production') {
      throw new Error('Cannot clean database in production');
    }
    const models = Reflect.ownKeys(this).filter(
      (key) => typeof key === 'string' && key[0] !== '_' && key[0] !== '$',
    );
    return Promise.all(
      models.map((modelKey) => (this as any)[modelKey].deleteMany()),
    );
  }
}
