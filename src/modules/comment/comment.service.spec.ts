import { Test, TestingModule } from '@nestjs/testing';
import { CommentService } from './comment.service';
import { CommentRepository } from './repository/comment.repository';
import { CommentMapper } from './mapper/comment.mapper';
import { RedisService } from 'src/shared/redis';

describe('CommentService (Unit Test)', () => {
  let service: CommentService;
  let commentRepository: jest.Mocked<any>;
  let redisService: jest.Mocked<any>;

  beforeEach(async () => {
    commentRepository = {
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
        CommentService,
        CommentMapper,
        { provide: CommentRepository, useValue: commentRepository },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get<CommentService>(CommentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
