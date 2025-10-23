# 🔒 Security Best Practices & Implementation

## Current Security Features

### ✅ Already Implemented

1. **Helmet.js** - HTTP headers security
   - XSS Protection
   - Content Security Policy
   - DNS Prefetch Control
   - Frame Guard (Clickjacking protection)
   - HSTS (HTTP Strict Transport Security)

2. **CORS Configuration**
   - Whitelist-based origin control
   - Credentials support

3. **JWT Authentication**
   - Token-based authentication
   - Secure token generation
   - Expiration handling

4. **Input Validation**
   - class-validator for DTO validation
   - Zod schema validation
   - Whitelist and forbid non-whitelisted properties

5. **Password Hashing**
   - Bcrypt with configurable rounds
   - Salt generation

6. **Request Logging**
   - Winston logger for audit trails
   - Request/Response tracking
   - Error logging

7. **Compression**
   - Response compression for bandwidth optimization

8. **Cookie Parser**
   - Secure cookie handling

## Additional Security Measures to Implement

### 1. Rate Limiting (Highly Recommended)

```bash
npm install @nestjs/throttler
```

**Implementation:**

```typescript
// app.module.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,        // Time window in seconds
      limit: 100,     // Max requests per ttl
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

**Custom limits for sensitive endpoints:**

```typescript
@UseGuards(ThrottlerGuard)
@Throttle(5, 60) // 5 requests per minute
@Post('login')
async login(@Body() loginDto: LoginDto) {
  return this.authService.login(loginDto);
}
```

### 2. CSRF Protection

```bash
npm install csurf
npm install @types/csurf --save-dev
```

```typescript
import * as csurf from 'csurf';

// In main.ts
app.use(csurf({ cookie: true }));
```

### 3. SQL Injection Protection

✅ **Already protected by Prisma ORM** - Uses parameterized queries

**Best practices:**
```typescript
// ✅ SAFE - Prisma handles escaping
await prisma.user.findMany({
  where: {
    username: userInput
  }
});

// ❌ NEVER DO THIS
await prisma.$queryRaw`SELECT * FROM users WHERE username = ${userInput}`;

// ✅ If raw SQL needed, use parameterized queries
await prisma.$queryRaw`SELECT * FROM users WHERE username = ${Prisma.sql([userInput])}`;
```

### 4. XSS Prevention

**Input sanitization:**

```bash
npm install class-sanitizer
```

```typescript
import { Transform } from 'class-transformer';
import * as sanitizeHtml from 'sanitize-html';

export class CreateSuratDto {
  @Transform(({ value }) => sanitizeHtml(value))
  @IsString()
  perihal: string;
}
```

### 5. File Upload Security

```bash
npm install multer
npm install @types/multer --save-dev
```

**Secure configuration:**

```typescript
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as crypto from 'crypto';

const storage = diskStorage({
  destination: './uploads',
  filename: (req, file, callback) => {
    const uniqueName = crypto.randomBytes(16).toString('hex');
    const ext = extname(file.originalname);
    callback(null, `${uniqueName}${ext}`);
  },
});

const fileFilter = (req, file, callback) => {
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  const extName = allowedTypes.test(extname(file.originalname).toLowerCase());
  const mimeType = allowedTypes.test(file.mimetype);
  
  if (extName && mimeType) {
    callback(null, true);
  } else {
    callback(new Error('Invalid file type'), false);
  }
};

@UseInterceptors(
  FileInterceptor('file', {
    storage,
    fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  }),
)
async uploadFile(@UploadedFile() file: Express.Multer.File) {
  // Scan file for viruses if needed
  // Store file metadata in database
}
```

### 6. Environment Variables Security

**Never commit .env files:**

```bash
# .gitignore
.env
.env.local
.env.production
*.pem
*.key
```

**Use strong secrets:**

```bash
# Generate strong secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or use dotenv-cli for multiple environments
npm install dotenv-cli --save-dev
```

### 7. Database Security

**Connection string security:**

```env
# ❌ BAD - Hardcoded credentials
DATABASE_URL="mysql://root:password123@localhost:3306/db"

# ✅ GOOD - Strong credentials
DATABASE_URL="mysql://app_user:$(openssl rand -base64 32)@localhost:3306/db?ssl=true"
```

**Database user privileges:**

```sql
-- Create dedicated user with minimal privileges
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON smart_e_arsip.* TO 'app_user'@'localhost';
FLUSH PRIVILEGES;

-- Don't use root user in production
```

### 8. Redis Security

```env
# Enable Redis password
REDIS_PASSWORD=your_strong_redis_password

# Bind to localhost only (if not using external access)
# In redis.conf:
bind 127.0.0.1

# Disable dangerous commands
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG ""
```

### 9. HTTPS/TLS Configuration

**For production:**

```typescript
// main.ts
import * as fs from 'fs';

const httpsOptions = {
  key: fs.readFileSync('./secrets/private-key.pem'),
  cert: fs.readFileSync('./secrets/public-certificate.pem'),
};

const app = await NestFactory.create(AppModule, {
  httpsOptions,
});
```

**Or use reverse proxy (Nginx/Apache):**

```nginx
server {
  listen 443 ssl http2;
  server_name yourdomain.com;

  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;
  
  # Modern SSL configuration
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
  ssl_prefer_server_ciphers off;
  
  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

### 10. API Versioning

```typescript
// main.ts
app.setGlobalPrefix('api');
app.enableVersioning({
  type: VersioningType.URI,
  defaultVersion: '1',
});

// Usage
@Controller({
  path: 'users',
  version: '1',
})
export class UsersV1Controller {}
```

### 11. Security Headers Enhancement

```typescript
// main.ts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

### 12. Session Management

```bash
npm install express-session
npm install @types/express-session --save-dev
```

```typescript
import * as session from 'express-session';
import * as connectRedis from 'connect-redis';

const RedisStore = connectRedis(session);

app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true, // HTTPS only
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      sameSite: 'strict',
    },
  }),
);
```

## Security Checklist

### Development Phase
- [ ] All passwords are hashed with bcrypt (rounds ≥ 10)
- [ ] JWT secrets are strong (≥ 32 characters)
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (using ORM)
- [ ] XSS prevention (sanitize inputs)
- [ ] CSRF protection enabled
- [ ] Rate limiting implemented
- [ ] Error messages don't leak sensitive info
- [ ] Logging doesn't include passwords/secrets
- [ ] File upload validation and restrictions

### Before Production
- [ ] Environment variables are not hardcoded
- [ ] .env files are in .gitignore
- [ ] HTTPS/TLS enabled
- [ ] Security headers configured (Helmet)
- [ ] CORS properly configured
- [ ] Database user has minimal privileges
- [ ] Redis password is set
- [ ] Dangerous Redis commands disabled
- [ ] Regular security updates (npm audit)
- [ ] Secrets rotation plan in place
- [ ] Backup strategy implemented
- [ ] Monitoring and alerting set up
- [ ] DDoS protection (CloudFlare/AWS Shield)
- [ ] WAF (Web Application Firewall) configured

### Regular Maintenance
- [ ] Run `npm audit` weekly
- [ ] Update dependencies monthly
- [ ] Review logs for suspicious activity
- [ ] Rotate secrets quarterly
- [ ] Security penetration testing
- [ ] Review user permissions
- [ ] Backup verification

## Common Vulnerabilities to Avoid

### 1. Sensitive Data Exposure

```typescript
// ❌ BAD - Exposing password hash
@Get(':id')
async findOne(@Param('id') id: string) {
  return this.userService.findOne(+id); // Returns password field
}

// ✅ GOOD - Exclude sensitive fields
@Get(':id')
async findOne(@Param('id') id: string) {
  return this.userService.findOne(+id, {
    select: {
      id: true,
      username: true,
      nama_lengkap: true,
      role: true,
      // password: false (excluded)
    }
  });
}
```

### 2. Broken Authentication

```typescript
// ❌ BAD - Weak password requirements
@IsString()
@MinLength(4)
password: string;

// ✅ GOOD - Strong password requirements
@IsString()
@MinLength(8)
@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
  message: 'Password must contain uppercase, lowercase, number and special character'
})
password: string;
```

### 3. Broken Access Control

```typescript
// ❌ BAD - No authorization check
@Delete(':id')
async remove(@Param('id') id: string) {
  return this.service.remove(+id);
}

// ✅ GOOD - Role-based access control
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Delete(':id')
async remove(@Param('id') id: string) {
  return this.service.remove(+id);
}
```

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security](https://docs.nestjs.com/security/encryption-and-hashing)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)

## Emergency Response

If security breach detected:

1. **Immediately** revoke all JWT tokens
2. Force password reset for all users
3. Rotate all secrets and API keys
4. Review logs for extent of breach
5. Patch vulnerability
6. Notify affected users (if required by law)
7. Document incident for future prevention
