jest.mock('@nestjs/terminus', () => ({
  HealthCheckService: class HealthCheckService {},
  MemoryHealthIndicator: class MemoryHealthIndicator {},
  MongooseHealthIndicator: class MongooseHealthIndicator {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import {
  HealthCheckService,
  MemoryHealthIndicator,
  MongooseHealthIndicator,
} from '@nestjs/terminus';
import { HealthService } from './health.service';
import { RedisService } from 'src/shared/redis/redis.service';

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: HealthCheckService,
          useValue: { check: jest.fn() },
        },
        {
          provide: MemoryHealthIndicator,
          useValue: { checkHeap: jest.fn(), checkRSS: jest.fn() },
        },
        {
          provide: MongooseHealthIndicator,
          useValue: { pingCheck: jest.fn() },
        },
        {
          provide: RedisService,
          useValue: {
            getClient: jest.fn().mockReturnValue({
              ping: jest.fn().mockResolvedValue('PONG'),
            }),
          },
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
