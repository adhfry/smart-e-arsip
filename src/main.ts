import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { HttpCacheInterceptor } from './common/interceptors/http-cache.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('APP_PORT') || 3006;

  const frontendUrls = (
    configService.get<string>('FRONTEND_URLS') || 'http://localhost:3003'
  ).split(',');

  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';
  const isDevelopment = nodeEnv === 'development';

  // Helmet configuration - more permissive for development
  if (isDevelopment) {
    app.use(
      helmet({
        contentSecurityPolicy: false, // Disable CSP in development for easier debugging
      }),
    );
  } else {
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", ...frontendUrls],
          },
        },
      }),
    );
  }

  app.use(
    compression({
      filter: (req: any, res: any) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
      level: 6,
    }),
  );

  // CORS configuration - allow Swagger UI and frontend
  const allowedOrigins = isDevelopment 
    ? [...frontendUrls, 'http://localhost:3006', 'http://[::1]:3006', 'http://127.0.0.1:3006']
    : frontendUrls;

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like Swagger UI, mobile apps, curl)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  app.use(cookieParser());
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TimeoutInterceptor(30000),
    new HttpCacheInterceptor(app.get('CACHE_MANAGER'), reflector),
    new ResponseInterceptor(),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);

  // Setup Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Smart E-Arsip API')
    .setDescription(
      `🚀 API Backend untuk sistem arsip elektronik Smart E-Arsip
      
**Features:**
- ⚡ Redis Caching untuk performa optimal
- 🔐 JWT Authentication & Authorization
- 📝 Manajemen Surat Masuk/Keluar
- 📋 Sistem Disposisi Digital
- 🤖 AI Integration untuk ekstraksi data

**Base URL:** \`/api\`

**Documentation:**
- User API with Redis Caching: See USER_API_CACHE.md
- Security: See SECURITY.md
- Development: See DEVELOPMENT.md

**Cache Strategy:**
- User data: 1 hour TTL
- Stats: 5 minutes TTL
- Search results: 10 minutes TTL
- Auto-invalidation on updates

Check response logs to verify cache HIT/MISS!
      `,
    )
    .setVersion('1.0')
    .setContact(
      'Smart E-Arsip Team',
      'https://github.com/your-repo',
      'support@smartearsip.id',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addTag('👤 User Management', 'CRUD User dengan Redis Caching (Check logs untuk cache HIT/MISS)')
    .addTag('🔐 Authentication', 'Login, Logout, Token Management')
    .addTag('📨 Surat Masuk', 'Manajemen Surat Masuk dengan AI')
    .addTag('📤 Surat Keluar', 'Manajemen Surat Keluar')
    .addTag('📋 Disposisi', 'Manajemen Disposisi Digital')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addServer('http://localhost:3006', 'Development Server')
    .addServer('http://localhost', 'Production Server (Nginx)')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
    ignoreGlobalPrefix: false,
  });

  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Smart E-Arsip API - Documentation',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .info .title { font-size: 36px; color: #e0234e; }
      .swagger-ui .info .description { font-size: 14px; line-height: 1.6; }
      .swagger-ui .scheme-container { background: #fafafa; padding: 15px; margin: 20px 0; }
      .swagger-ui .opblock-tag { 
        font-size: 20px; 
        font-weight: bold;
        border-left: 4px solid #e0234e;
        padding-left: 10px;
      }
      .swagger-ui .opblock-summary-description { font-size: 14px; }
      .swagger-ui table thead tr td, .swagger-ui table thead tr th { 
        font-weight: bold; 
        background: #f7f7f7;
      }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      defaultModelsExpandDepth: 3,
      defaultModelExpandDepth: 3,
      docExpansion: 'list',
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  await app.listen(port, '0.0.0.0');
  const baseUrl = await app.getUrl();
  console.log(`
╔══════════════════════════════════════════════════════════╗
║         🚀 Smart E-Arsip API - Server Started           ║
╠══════════════════════════════════════════════════════════╣
║  📡 Server URL:        ${baseUrl.padEnd(30)}║
║  📚 API Documentation: ${(baseUrl + '/api/docs').padEnd(30)}║
║  ⚡ Redis Caching:     ENABLED                          ║
║  🔒 Security:          ENABLED (Helmet + CORS)          ║
║  📊 Logging:           Winston + File Rotation          ║
║  🗜️  Compression:       ENABLED (gzip level 6)          ║
╠══════════════════════════════════════════════════════════╣
║  💡 Tips:                                               ║
║  - Check logs/combined.log for cache HIT/MISS          ║
║  - Monitor response times in Swagger UI                ║
║  - Read USER_API_CACHE.md for cache documentation      ║
╚══════════════════════════════════════════════════════════╝
  `);
}
bootstrap();
