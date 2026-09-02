import { Test, TestingModule } from '@nestjs/testing';
import { FormService } from './form.service';
import { FormRepository } from './repository/form.repository';
import { FormMapper } from './mapper/form.mapper';
import { StorageService } from 'src/shared/storage/storage.service';
import { RedisService } from 'src/shared/redis';

describe('FormService (Unit Test)', () => {
  let service: FormService;
  let formRepository: jest.Mocked<any>;
  let redisService: jest.Mocked<any>;

  beforeEach(async () => {
    formRepository = {
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
        FormService,
        FormMapper,
        { provide: FormRepository, useValue: formRepository },
        { provide: StorageService, useValue: { uploadFile: jest.fn() } },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get<FormService>(FormService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
