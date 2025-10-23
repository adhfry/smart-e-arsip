import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Reflector } from '@nestjs/core';

// Decorator untuk skip cache pada endpoint tertentu
export const SKIP_CACHE_KEY = 'skipCache';
export const SkipCache =
  () => (target: any, key: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(SKIP_CACHE_KEY, true, descriptor.value);
    return descriptor;
  };

// Decorator untuk custom cache TTL (dalam milidetik)
export const CACHE_TTL_KEY = 'cacheTtl';
export const CacheTTL =
  (ttl: number) =>
  (target: any, key: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(CACHE_TTL_KEY, ttl, descriptor.value);
    return descriptor;
  };

/**
 * 🚀 ULTRA-FAST HTTP Cache Interceptor
 * 
 * Strategi Caching Agresif:
 * - Cache SEMUA GET requests kecuali yang di-skip
 * - TTL default: 0 (unlimited) - data di-invalidate manual saat mutation
 * - Response langsung dari Redis tanpa delay
 * - Zero tolerance untuk cache miss - semua data harus ter-cache
 */
@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpCacheInterceptor.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Hanya cache GET requests
    if (method !== 'GET') {
      return next.handle();
    }

    // Cek apakah endpoint ini di-skip dari caching
    const skipCache = this.reflector.get<boolean>(
      SKIP_CACHE_KEY,
      context.getHandler(),
    );

    if (skipCache) {
      this.logger.debug(`⏭️  Cache SKIPPED: ${request.url}`);
      return next.handle();
    }

    // Generate cache key dari URL dan query params
    const cacheKey = this.generateCacheKey(request);
    const startTime = Date.now();

    try {
      // ⚡ ULTRA-FAST: Try get from cache (Redis should respond in <1ms)
      const cachedResponse = await this.cacheManager.get(cacheKey);

      if (cachedResponse) {
        const cacheTime = Date.now() - startTime;
        this.logger.debug(`⚡ CACHE HIT (${cacheTime}ms): ${request.url}`);
        
        // Return immediately from cache - NO DATABASE QUERY!
        return of(cachedResponse);
      }

      // Cache MISS - fetch from database
      const dbStartTime = Date.now();
      this.logger.debug(`⏳ Cache MISS - Fetching from DB: ${request.url}`);

      // Get custom TTL atau gunakan default
      const customTtl = this.reflector.get<number>(
        CACHE_TTL_KEY,
        context.getHandler(),
      );

      // Default: 0 = unlimited (data di-invalidate manual saat mutation)
      const ttl = customTtl ?? 0; 

      return next.handle().pipe(
        tap(async (response) => {
          const dbTime = Date.now() - dbStartTime;
          
          // Simpan response ke cache (async - no await untuk kecepatan)
          this.cacheManager.set(cacheKey, response, ttl).then(() => {
            const totalTime = Date.now() - startTime;
            this.logger.log(
              `💾 CACHED (DB: ${dbTime}ms, Total: ${totalTime}ms): ${request.url} → TTL: ${ttl === 0 ? 'unlimited' : `${ttl}ms`}`,
            );
          });
        }),
      );
    } catch (error) {
      // Redis error - fallback to database without caching
      this.logger.error(`❌ Cache error: ${error.message} - Falling back to DB`);
      return next.handle();
    }
  }

  private generateCacheKey(request: any): string {
    const userId = request.user?.id || 'anon';
    const url = request.url;
    const query = JSON.stringify(request.query || {});
    
    // Key format: http:cache:{userId}:{path}:{query}
    return `http:cache:${userId}:${url}:${query}`;
  }
}
