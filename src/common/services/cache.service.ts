import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

/**
 * 🚀 ULTRA-FAST Cache Service dengan Redis
 * 
 * Optimasi untuk K6 Load Testing:
 * - TTL Default: 0 (unlimited) - invalidate manual saat mutation
 * - Pipeline untuk batch operations
 * - Zero delay pada cache operations
 * - Aggressive caching strategy
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private redisClient: Redis;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {
    // Inisialisasi Redis client dengan performance tuning
    this.redisClient = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      db: this.configService.get<number>('REDIS_DB', 0),
      // Performance optimization
      enableOfflineQueue: false, // Fail fast if Redis down
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // Don't retry on failure
      lazyConnect: false,
      enableReadyCheck: true,
    });

    this.redisClient.on('connect', () => {
      this.logger.log('✅ Redis connected - ULTRA-FAST cache ready!');
    });

    this.redisClient.on('error', (err) => {
      this.logger.error(`❌ Redis error: ${err.message}`);
    });
  }

  /**
   * 🚀 ULTRA-FAST: Get cached data atau fetch dari database jika tidak ada
   * Pattern: Cache-Aside / Lazy Loading
   * 
   * Performance: <1ms dari cache, fallback ke DB jika cache miss
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = 0, // Default: 0 = unlimited (manual invalidation)
  ): Promise<T> {
    const startTime = Date.now();

    try {
      // ⚡ STEP 1: Try cache first (should be <1ms)
      const cached = await this.cacheManager.get<T>(key);

      if (cached !== null && cached !== undefined) {
        const cacheTime = Date.now() - startTime;
        this.logger.debug(`⚡ Cache HIT (${cacheTime}ms): ${key}`);
        return cached;
      }

      // ⏳ STEP 2: Cache MISS - fetch from database
      this.logger.debug(`⏳ Cache MISS - Fetching from DB: ${key}`);
      const dbStartTime = Date.now();
      const data = await fetchFn();
      const dbTime = Date.now() - dbStartTime;

      // ✅ STEP 3: Store in cache (non-blocking)
      if (data !== null && data !== undefined) {
        // Fire-and-forget untuk kecepatan
        this.cacheManager.set(key, data, ttl).then(() => {
          const totalTime = Date.now() - startTime;
          this.logger.log(
            `💾 CACHED (DB: ${dbTime}ms, Total: ${totalTime}ms): ${key} → TTL: ${ttl === 0 ? 'unlimited' : `${ttl}ms`}`,
          );
        });
      }

      return data;
    } catch (error) {
      // Fallback ke DB jika Redis error
      this.logger.error(`Cache error for ${key}: ${error.message}`);
      return await fetchFn();
    }
  }

  /**
   * ⚡ INSTANT: Invalidate single key
   */
  async invalidate(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`🗑️  Invalidated: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to invalidate ${key}: ${error.message}`);
    }
  }

  /**
   * 🔥 ULTRA-FAST: Invalidate multiple keys dengan pattern
   * Menggunakan Redis SCAN + Pipeline untuk performance maksimal
   */
  async invalidatePattern(pattern: string): Promise<void> {
    const startTime = Date.now();

    try {
      const keys: string[] = [];
      const stream = this.redisClient.scanStream({
        match: pattern,
        count: 1000, // Batch size besar untuk kecepatan
      });

      stream.on('data', (resultKeys: string[]) => {
        keys.push(...resultKeys);
      });

      await new Promise((resolve, reject) => {
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      if (keys.length > 0) {
        // ⚡ Delete all keys dengan PIPELINE (atomic & fast!)
        const pipeline = this.redisClient.pipeline();
        keys.forEach((key) => pipeline.del(key));
        await pipeline.exec();
        
        const time = Date.now() - startTime;
        this.logger.log(`🗑️  Invalidated ${keys.length} keys matching "${pattern}" in ${time}ms`);
      } else {
        this.logger.debug(`No keys found matching pattern: ${pattern}`);
      }
    } catch (error) {
      this.logger.error(`Error invalidating pattern ${pattern}: ${error.message}`);
    }
  }

  /**
   * ⚡ Set data ke cache (async - non-blocking)
   */
  async set<T>(key: string, value: T, ttl: number = 0): Promise<void> {
    if (value !== null && value !== undefined) {
      await this.cacheManager.set(key, value, ttl);
    }
  }

  /**
   * ⚡ Get data dari cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    return await this.cacheManager.get<T>(key);
  }

  /**
   * 🚀 BATCH GET: Ambil multiple keys dengan MGET (1 round trip!)
   */
  async mget<T>(keys: string[]): Promise<(T | undefined)[]> {
    if (keys.length === 0) return [];

    try {
      // Use Redis MGET untuk fetch semua keys dalam 1 command
      const values = await this.redisClient.mget(...keys);
      return values.map((val) => (val ? JSON.parse(val) : undefined));
    } catch (error) {
      this.logger.error(`Batch get error: ${error.message}`);
      return keys.map(() => undefined);
    }
  }

  /**
   * 🚀 BATCH SET: Set multiple keys dengan PIPELINE (atomic!)
   */
  async mset(
    items: Array<{ key: string; value: any; ttl?: number }>,
  ): Promise<void> {
    if (items.length === 0) return;

    try {
      const pipeline = this.redisClient.pipeline();

      items.forEach((item) => {
        const ttl = item.ttl || 0;
        const value = JSON.stringify(item.value);

        if (ttl > 0) {
          pipeline.setex(item.key, Math.floor(ttl / 1000), value);
        } else {
          pipeline.set(item.key, value);
        }
      });

      await pipeline.exec();
      this.logger.debug(`📦 Batch set ${items.length} keys`);
    } catch (error) {
      this.logger.error(`Batch set error: ${error.message}`);
    }
  }

  /**
   * 🗑️  Clear specific keys dengan PIPELINE
   */
  async clear(keys: string[]): Promise<void> {
    if (keys && keys.length > 0) {
      try {
        const pipeline = this.redisClient.pipeline();
        keys.forEach((key) => pipeline.del(key));
        await pipeline.exec();
        this.logger.debug(`🗑️  Cleared ${keys.length} keys`);
      } catch (error) {
        this.logger.error(`Clear keys error: ${error.message}`);
      }
    }
  }

  /**
   * 🔥 FLUSH ALL (development only!)
   */
  async flushAll(): Promise<void> {
    if (this.configService.get('NODE_ENV') !== 'production') {
      await this.redisClient.flushall();
      this.logger.warn('⚠️  FLUSHED ALL CACHE!');
    }
  }

  /**
   * 📊 Get cache statistics
   */
  async getStats(): Promise<{
    keys: number;
    memory: string;
    hits: string;
    misses: string;
  }> {
    try {
      const info = await this.redisClient.info('stats');
      const dbsize = await this.redisClient.dbsize();

      return {
        keys: dbsize,
        memory: 'N/A',
        hits: info.match(/keyspace_hits:(\d+)/)?.[1] || '0',
        misses: info.match(/keyspace_misses:(\d+)/)?.[1] || '0',
      };
    } catch (error) {
      return { keys: 0, memory: 'N/A', hits: '0', misses: '0' };
    }
  }
}
