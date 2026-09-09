import { Test, TestingModule } from '@nestjs/testing';
import { ClassificationService } from './classification.service';
import { ClassificationMapper } from './mapper/classification.mapper';
import { UsersRepository } from '../users/repository/users.repository';
import { TypeLawyerRepository } from '../lawyer/repository/type-lawyer.repository';
import { ConfigService } from '@nestjs/config';
import { RedisService } from 'src/shared/redis';

describe('ClassificationService (Unit Test)', () => {
  let service: ClassificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassificationService,
        ClassificationMapper,
        { provide: UsersRepository, useValue: { find: jest.fn() } },
        { provide: TypeLawyerRepository, useValue: { find: jest.fn() } },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('mock_gemini_key') },
        },
        { provide: RedisService, useValue: { get: jest.fn(), set: jest.fn() } },
      ],
    }).compile();

    service = module.get<ClassificationService>(ClassificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
