import { Test, TestingModule } from '@nestjs/testing';
import { MessNotificationService } from './mess-notification.service';
import { MessNotificationRepository } from './repository/mess-notification.repository';
import { MessageGateway } from '../message/message.gateway';

describe('MessNotificationService', () => {
  let service: MessNotificationService;
  let messNotificationRepository: jest.Mocked<any>;
  let messageGateway: jest.Mocked<any>;

  beforeEach(async () => {
    messNotificationRepository = {
      find: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue(null),
      findWithPagination: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      findOneAndUpdate: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
    };

    messageGateway = {
      server: {
        to: jest.fn().mockReturnValue({
          emit: jest.fn(),
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessNotificationService,
        {
          provide: MessNotificationRepository,
          useValue: messNotificationRepository,
        },
        {
          provide: MessageGateway,
          useValue: messageGateway,
        },
      ],
    }).compile();

    service = module.get<MessNotificationService>(MessNotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
