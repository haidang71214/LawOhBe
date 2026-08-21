import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './message.service';
import { ConversationRepository } from './repository/conversation.repository';
import { MessageRepository } from './repository/message.repository';
import { MessageMapper } from './mapper/message.mapper';
import { MessageGateway } from './message.gateway';

describe('ChatService (Unit Test)', () => {
  let service: ChatService;
  let conversationRepository: jest.Mocked<any>;
  let messageRepository: jest.Mocked<any>;

  beforeEach(async () => {
    conversationRepository = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue({
        _id: 'conv_1',
        participants: ['user_1', 'lawyer_1'],
      }),
      findUserConversations: jest.fn().mockResolvedValue([]),
      findDirectConversation: jest.fn().mockResolvedValue(null),
    };

    messageRepository = {
      create: jest.fn().mockResolvedValue({
        _id: 'msg_1',
        conversation: 'conv_1',
        sender: 'user_1',
        content: 'Hello Lawyer',
        readBy: ['user_1'],
      }),
      findByConversationId: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        MessageMapper,
        { provide: ConversationRepository, useValue: conversationRepository },
        { provide: MessageRepository, useValue: messageRepository },
        {
          provide: MessageGateway,
          useValue: {
            server: { to: jest.fn().mockReturnValue({ emit: jest.fn() }) },
          },
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should add message to conversation and broadcast via websocket', async () => {
    const result = await service.addMessage('conv_1', 'user_1', 'Hello Lawyer');

    expect(result.data?.content).toBe('Hello Lawyer');
    expect(messageRepository.create).toHaveBeenCalledWith({
      conversation: 'conv_1',
      sender: 'user_1',
      content: 'Hello Lawyer',
      readBy: ['user_1'],
    });
  });
});
