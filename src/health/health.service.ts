import { Injectable } from '@nestjs/common';
import {
  HealthCheckService,
  HealthIndicatorResult,
  MemoryHealthIndicator,
  MongooseHealthIndicator,
} from '@nestjs/terminus';
import { RedisService } from 'src/shared/redis/redis.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly mongoose: MongooseHealthIndicator,
    private readonly redisService: RedisService,
  ) {}

  checkMemoryHeap() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
    ]);
  }

  checkLiveness() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 500 * 1024 * 1024),
    ]);
  }

  checkReadiness() {
    return this.health.check([
      () => this.checkMongo(),
      () => this.checkRedis(),
    ]);
  }

  checkAll() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
      () => this.checkMongo(),
      () => this.checkRedis(),
    ]);
  }

  private checkMongo() {
    return this.mongoose.pingCheck('mongodb');
  }

  private async checkRedis(): Promise<HealthIndicatorResult> {
    const client = this.redisService.getClient();
    if (!client) {
      throw new Error('Redis client is not initialized');
    }
    const response = await client.ping();
    if (response !== 'PONG') {
      throw new Error('Redis ping did not return PONG');
    }
    return { redis: { status: 'up' } };
  }
}
