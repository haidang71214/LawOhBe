jest.mock('@nestjs/terminus', () => ({
  HealthCheck: () => () => {},
  HealthCheckService: jest.fn(),
  MemoryHealthIndicator: jest.fn(),
  MongooseHealthIndicator: jest.fn(),
  MicroserviceHealthIndicator: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;

  const mockHealthService = {
    checkAll: jest.fn(),
    checkLiveness: jest.fn(),
    checkReadiness: jest.fn(),
    checkMemoryHeap: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
