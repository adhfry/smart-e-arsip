import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user } = request;
    const userAgent = request.get('user-agent') || '';
    const ip = request.ip;

    const now = Date.now();
    const userId = user?.id || 'anonymous';

    // Log request
    this.logger.log(
      `📥 [${method}] ${url} - User: ${userId} - IP: ${ip} - UA: ${userAgent}`,
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const contentLength = JSON.stringify(data).length;
          const responseTime = Date.now() - now;

          // Log response dengan performance metrics
          this.logger.log(
            `📤 [${method}] ${url} - Status: ${statusCode} - ${responseTime}ms - ${contentLength} bytes`,
          );

          // Warn jika response time > 1 detik
          if (responseTime > 1000) {
            this.logger.warn(
              `⚠️ SLOW REQUEST: [${method}] ${url} took ${responseTime}ms`,
            );
          }
        },
        error: (error) => {
          const responseTime = Date.now() - now;
          this.logger.error(
            `❌ [${method}] ${url} - Error: ${error.message} - ${responseTime}ms`,
            error.stack,
          );
        },
      }),
    );
  }
}
