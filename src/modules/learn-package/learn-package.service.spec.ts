import { Test, TestingModule } from '@nestjs/testing';
import { LearnPackageService } from './learn-package.service';
import { LearnPackageRepository } from './repository/learn-package.repository';
import { LearnPackageMapper } from './mapper/learn-package.mapper';
import { UsersRepository } from '../users/repository/users.repository';
import { RedisService } from 'src/shared/redis';

describe('LearnPackageService (Unit Test)', () => {
  let service: LearnPackageService;
  let learnPackageRepository: jest.Mocked<any>;
  let redisService: jest.Mocked<any>;

  beforeEach(async () => {
    learnPackageRepository = {
      create: jest.fn(),
      findWithPagination: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };

    redisService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(true),
      delByPattern: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LearnPackageService,
        LearnPackageMapper,
        { provide: LearnPackageRepository, useValue: learnPackageRepository },
        { provide: UsersRepository, useValue: { findById: jest.fn() } },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get<LearnPackageService>(LearnPackageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
