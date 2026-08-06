import { Test, TestingModule } from '@nestjs/testing';
import { LawyerService } from './lawyer.service';
import { UsersRepository } from '../users/repository/users.repository';
import { TypeLawyerRepository } from './repository/type-lawyer.repository';
import { SubTypeLawyerRepository } from './repository/sub-type-lawyer.repository';
import { CustomPriceRepository } from './repository/custom-price.repository';
import { LawyerMapper } from './mapper/lawyer.mapper';
import { RedisService } from 'src/shared/redis';

describe('LawyerService (Unit Test)', () => {
  let service: LawyerService;
  let usersRepository: jest.Mocked<any>;
  let typeLawyerRepository: jest.Mocked<any>;
  let redisService: jest.Mocked<any>;

  beforeEach(async () => {
    usersRepository = {
      findWithPagination: jest.fn().mockResolvedValue({
        data: [
          { _id: 'lawyer_1', name: 'Lawyer One', role: 'lawyer', star: 4.8 },
        ],
        total: 1,
      }),
      findById: jest.fn(),
    };

    typeLawyerRepository = {
      findByTypeRegex: jest.fn().mockResolvedValue([{ lawyer_id: 'lawyer_1' }]),
    };

    redisService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(true),
      delByPattern: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LawyerService,
        LawyerMapper,
        { provide: UsersRepository, useValue: usersRepository },
        { provide: TypeLawyerRepository, useValue: typeLawyerRepository },
        {
          provide: SubTypeLawyerRepository,
          useValue: {
            findByParentType: jest.fn(),
            deleteMany: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: CustomPriceRepository,
          useValue: {
            find: jest.fn(),
            deleteMany: jest.fn(),
            create: jest.fn(),
          },
        },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get<LawyerService>(LawyerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should filter lawyers with escaped regex search', async () => {
    const result = await service.filterLawyers({
      province: 'Ha Noi.*',
      typeLawyer: 'CIVIL',
      page: 1,
      limit: 10,
    });

    expect(result.data?.data).toHaveLength(1);
    expect(typeLawyerRepository.findByTypeRegex).toHaveBeenCalledWith('CIVIL');
    expect(usersRepository.findWithPagination).toHaveBeenCalled();
  });
});
