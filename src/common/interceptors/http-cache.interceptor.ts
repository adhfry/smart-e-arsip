import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
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

// Decorator untuk custom cache TTL
export const CACHE_TTL_KEY = 'cacheTtl';
export const CacheTTL =
  (ttl: number) =>
  (target: any, key: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(CACHE_TTL_KEY, ttl, descriptor.value);
    return descriptor;
  };

@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
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
      return next.handle();
    }

    // Generate cache key dari URL dan query params
    const cacheKey = this.generateCacheKey(request);

    // Coba ambil dari cache
    const cachedResponse = await this.cacheManager.get(cacheKey);

    if (cachedResponse) {
      // Jika ada di cache, return langsung
      return of(cachedResponse);
    }

    // Jika tidak ada di cache, lanjutkan request dan simpan responsenya
    const customTtl = this.reflector.get<number>(
      CACHE_TTL_KEY,
      context.getHandler(),
    );

    return next.handle().pipe(
      tap(async (response) => {
        // Simpan response ke cache
        await this.cacheManager.set(
          cacheKey,
          response,
          customTtl || 300000, // Default 5 menit (dalam ms)
        );
      }),
    );
  }

  private generateCacheKey(request: any): string {
    const userId = request.user?.id || 'anonymous';
    const url = request.url;
    const query = JSON.stringify(request.query);

    return `cache:${userId}:${url}:${query}`;
  }
}
