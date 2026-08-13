import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { PaymentRepository } from './repository/payment.repository';
import { LawyerPaymentRepository } from './repository/lawyer-payment.repository';
import { BookingRepository } from '../booking/repository/booking.repository';
import { PaymentMapper } from './mapper/payment.mapper';
import { RedisService } from 'src/shared/redis';

describe('PaymentService (Unit Test)', () => {
  let service: PaymentService;
  let paymentRepository: jest.Mocked<any>;
  let lawyerPaymentRepository: jest.Mocked<any>;
  let bookingRepository: jest.Mocked<any>;
  let redisService: jest.Mocked<any>;

  beforeEach(async () => {
    paymentRepository = {
      create: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      findWithPagination: jest.fn(),
    };

    lawyerPaymentRepository = {
      create: jest.fn(),
      findByPaymentId: jest.fn(),
      find: jest.fn(),
      getIncomeSummary: jest.fn().mockResolvedValue({
        totalTransactions: 5,
        totalGrossRevenue: 1000000,
        totalNetIncome: 900000,
        totalPlatformCommission: 100000,
      }),
      findWithPagination: jest.fn(),
    };

    bookingRepository = {
      findByIdAndUpdate: jest.fn().mockResolvedValue(true),
    };

    redisService = {
      delByPattern: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        PaymentMapper,
        { provide: PaymentRepository, useValue: paymentRepository },
        {
          provide: LawyerPaymentRepository,
          useValue: lawyerPaymentRepository,
        },
        { provide: BookingRepository, useValue: bookingRepository },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should process successful payment and update booking status to paid', async () => {
    const mockPayment = {
      _id: 'payment_123',
      transaction_no: 'TXN_12345',
      amount: 500000,
      booking_id: 'booking_456',
      lawyer_id: 'lawyer_789',
      status: 'success',
    };

    paymentRepository.findOneAndUpdate.mockResolvedValueOnce(mockPayment);
    lawyerPaymentRepository.findByPaymentId.mockResolvedValueOnce(null);
    lawyerPaymentRepository.create.mockResolvedValueOnce({
      _id: 'lp_123',
      amount: 450000,
      commission: 50000,
      status: 'success',
    });

    const result = await service.processSuccessfulPayment('TXN_12345', '00');

    expect(result).toBeDefined();
    expect(bookingRepository.findByIdAndUpdate).toHaveBeenCalledWith(
      'booking_456',
      {
        status: 'paid',
        income: 500000,
        amount: 500000,
      },
    );
    expect(lawyerPaymentRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        lawyer_id: 'lawyer_789',
        amount: 450000, // 90%
        commission: 50000, // 10%
      }),
    );
  });

  it('should get lawyer revenue summary from aggregation', async () => {
    const result = await service.getLawyerIncomeSummary('lawyer_789');

    expect(result.data.totalTransactions).toBe(5);
    expect(result.data.totalNetIncome).toBe(900000);
    expect(result.data.totalPlatformCommission).toBe(100000);
    expect(result.data.commissionRate).toBe('10%');
  });
});
