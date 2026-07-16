import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST') || '127.0.0.1';
    const port = Number(this.configService.get<number>('REDIS_PORT')) || 6379;
    const password =
      this.configService.get<string>('REDIS_PASSWORD') || undefined;

    this.client = new Redis({
      host,
      port,
      password: password && password.trim() !== '' ? password : undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 200, 2000);
        return delay;
      },
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });

    this.client
      .connect()
      .then(() => {
        this.logger.log(`Connected to Redis server at ${host}:${port}`);
      })
      .catch((err) => {
        this.logger.warn(
          `Could not connect to Redis at ${host}:${port} (${err.message}). Application will continue in fallback mode.`,
        );
      });

    this.client.on('error', (err) => {
      this.logger.error(`Redis client error: ${err.message}`);
    });
  }

  getClient(): Redis {
    return this.client;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error: any) {
      this.logger.error(
        `Error reading key "${key}" from Redis: ${error.message}`,
      );
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const stringValue = JSON.stringify(value);
      if (ttlSeconds && ttlSeconds > 0) {
        await this.client.set(key, stringValue, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, stringValue);
      }
    } catch (error: any) {
      this.logger.error(
        `Error writing key "${key}" to Redis: ${error.message}`,
      );
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error: any) {
      this.logger.error(
        `Error deleting key "${key}" from Redis: ${error.message}`,
      );
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error: any) {
      this.logger.error(
        `Error deleting pattern "${pattern}" from Redis: ${error.message}`,
      );
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error: any) {
      this.logger.error(
        `Error checking exists for key "${key}": ${error.message}`,
      );
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error: any) {
      this.logger.error(`Error getting ttl for key "${key}": ${error.message}`);
      return -1;
    }
  }

  async acquireLock(key: string, ttlSeconds: number = 5): Promise<boolean> {
    try {
      const result = await this.client.set(
        `lock:${key}`,
        'locked',
        'EX',
        ttlSeconds,
        'NX',
      );
      return result === 'OK';
    } catch (error: any) {
      this.logger.error(`Error acquiring lock "${key}": ${error.message}`);
      return false;
    }
  }

  async releaseLock(key: string): Promise<void> {
    try {
      await this.client.del(`lock:${key}`);
    } catch (error: any) {
      this.logger.error(`Error releasing lock "${key}": ${error.message}`);
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.quit();
        this.logger.log('Redis client disconnected cleanly');
      } catch {
        this.client.disconnect();
      }
    }
  }
}
