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
export class CacheLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('CacheMonitor');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // Log request dengan response time
        this.logger.log(
          `${method} ${url} - ${responseTime}ms`,
        );

        // Jika response time sangat cepat (<10ms), kemungkinan dari cache
        if (responseTime < 10 && method === 'GET') {
          this.logger.debug(
            `⚡ FAST RESPONSE (Likely from cache): ${method} ${url} - ${responseTime}ms`,
          );
        } else if (method === 'GET') {
          this.logger.debug(
            `📊 DB QUERY: ${method} ${url} - ${responseTime}ms`,
          );
        }
      }),
    );
  }
}
