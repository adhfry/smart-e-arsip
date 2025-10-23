import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { HttpCacheInterceptor } from './common/interceptors/http-cache.interceptor';
import { Reflector } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('APP_PORT') || 3006;

  const frontendUrls = (
    configService.get<string>('FRONTEND_URLS') || 'http://localhost:3003'
  ).split(',');

  // 🚀 Performance: Compression untuk reduce response size (TANPA HELMET!)
  app.use(
    compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
      level: 6, // Compression level (0-9, default 6)
    }),
  );

  // Konfigurasi CORS
  app.enableCors({
    origin: frontendUrls,
    credentials: true,
  });

  // Pasang middleware cookie
  app.use(cookieParser());
  app.setGlobalPrefix('api');

  // 🚀 Validation Pipeline dengan transformation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // 🚀 Global Interceptors (order matters!)
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(
    new LoggingInterceptor(), // 1. Logging untuk monitoring
    new TimeoutInterceptor(30000), // 2. Timeout 30 detik
    new HttpCacheInterceptor(app.get('CACHE_MANAGER'), reflector), // 3. Auto-caching
    new ResponseInterceptor(), // 4. Response formatting (terakhir)
  );

  // Global Exception Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Setup Swagger
  const docBuilder = new DocumentBuilder()
    .setTitle('Smart E-Arsip API Documentation')
    .setDescription(
      `Smart E-Arsip — Sistem arsip elektronik modern dengan AI integration.\n\n` +
        `Dokumentasi ini mencakup endpoint otentikasi, manajemen user, surat masuk/keluar, disposisi, dan AI features. ` +
        `Lihat dokumentasi proyek dan rancangan DB untuk detail fitur & model.`,
    )
    .setVersion('1.0')
    .setContact(
      'Smart E-Arsip Team',
      'https://github.com/adhfry',
      'support@smartearsip.id',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Gunakan: `Authorization: Bearer <access_token>`. Token diperoleh dari POST /auth/login',
      },
      'access-token',
    )
    .addTag('App', 'Selamat Datang & info dasar')
    .addTag('Auth', 'Endpoint otentikasi: register, login, token')
    .addTag('Users', 'Manajemen profil user & data pegawai')
    .addTag('Surat Masuk', 'Manajemen surat masuk dengan AI')
    .addTag('Surat Keluar', 'Manajemen surat keluar')
    .addTag('Disposisi', 'Sistem disposisi digital')
    .addTag('AI Features', 'Ekstraksi data otomatis dengan AI');

  const swaggerConfig = docBuilder.build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      operationsSorter: 'alpha',
      tagsSorter: 'alpha',
    },
    explorer: true,
  });

  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);

  await app.listen(port);
  console.log(`🚀 Application is running on: ${await app.getUrl()}`);
  console.log(`📚 Swagger Docs available at: ${await app.getUrl()}/api-docs`);
  console.log(`⚡ Performance optimizations: ENABLED`);
  console.log(`🔒 Security features: ENABLED`);
}
bootstrap();
