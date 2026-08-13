import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as qs from 'qs';
import * as crypto from 'crypto';
import { Payment } from 'libs/schemas';
import {
  ResponseDto,
  PaymentItemResponseDto,
  PaymentListResponseDataDto,
} from './dto';
import { PaginationQueryDto } from 'libs/dto/pagination.dto';
import { getDeletedFilter } from 'libs/utils/pagination.util';
import { RedisService } from 'src/shared/redis';
import { PaymentRepository } from './repository/payment.repository';
import { LawyerPaymentRepository } from './repository/lawyer-payment.repository';
import { PaymentMapper } from './mapper/payment.mapper';
import { BookingRepository } from '../booking/repository/booking.repository';

@Injectable()
export class PaymentService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly lawyerPaymentRepository: LawyerPaymentRepository,
    private readonly bookingRepository: BookingRepository,
    private readonly paymentMapper: PaymentMapper,
    private readonly redisService: RedisService,
  ) {}

  async createPaymentUrl(
    amount: number,
    orderInfo: string,
    orderType: string,
    bankCode?: string,
    clientId?: string,
    lawyerId?: string,
    bookingId?: string,
  ): Promise<{ paymentUrl: string; txnRef: string }> {
    const tmnCode = process.env.VNP_TMN_CODE;
    const secretKey = process.env.VNP_HASH_SECRET;
    const vnpUrl = process.env.VNP_URL;
    const returnUrl = process.env.VNP_RETURN_URL;

    if (!tmnCode || !secretKey || !vnpUrl || !returnUrl) {
      throw new BadRequestException('Missing VNPay configuration');
    }

    const date = new Date();
    const createDate = `${date.getFullYear()}${this.padZero(date.getMonth() + 1)}${this.padZero(date.getDate())}${this.padZero(date.getHours())}${this.padZero(date.getMinutes())}${this.padZero(date.getSeconds())}`;
    const orderId = date.getTime().toString();

    const vnp_Params: any = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: orderType,
      vnp_Amount: amount * 100,
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: '127.0.0.1',
      vnp_CreateDate: createDate,
    };

    if (bankCode) {
      vnp_Params['vnp_BankCode'] = bankCode;
    }

    const sortedParams = this.sortObject(vnp_Params);
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    vnp_Params['vnp_SecureHash'] = signed;

    const paymentUrl = `${vnpUrl}?${qs.stringify(vnp_Params, { encode: false })}`;

    await this.paymentRepository.create({
      transaction_no: orderId,
      amount,
      client_id: clientId,
      lawyer_id: lawyerId,
      booking_id: bookingId,
      status: 'pending',
      payment_method: 'VNPAY',
    });

    // Invalidate cache
    await this.redisService.delByPattern('cache:payments:*');

    return { paymentUrl, txnRef: orderId };
  }

  private sortObject(obj: any): any {
    const sorted: any = {};
    const str: string[] = [];
    let key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
    }
    return sorted;
  }

  verifyVnpayReturn(vnp_Params: any): boolean {
    const secureHash = vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    const sortedParams = this.sortObject(vnp_Params);
    const secretKey = process.env.VNP_HASH_SECRET;

    if (!secretKey) {
      throw new BadRequestException(
        'VNP_HASH_SECRET is not configured in environment variables',
      );
    }

    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    return secureHash === signed;
  }

  verifyReturnUrl(vnp_Params: any): boolean {
    return this.verifyVnpayReturn(vnp_Params);
  }

  private padZero(num: number): string {
    return num < 10 ? `0${num}` : num.toString();
  }

  async processSuccessfulPayment(transactionNo: string, responseCode = '00') {
    const payment = await this.paymentRepository.findOneAndUpdate(
      { transaction_no: transactionNo },
      {
        status: 'success',
        response_code: responseCode,
        payment_date: new Date(),
      },
      { new: true },
    );

    if (payment) {
      if (payment.booking_id) {
        await this.bookingRepository.findByIdAndUpdate(payment.booking_id, {
          status: 'paid',
          income: payment.amount,
          amount: payment.amount,
        });
        await this.redisService.delByPattern('cache:bookings:*');
      }

      await this.createLawyerPaymentSplit(payment);
      await this.redisService.delByPattern('cache:payments:*');
    }

    return payment;
  }

  async processFailedPayment(transactionNo: string, responseCode = '97') {
    const payment = await this.paymentRepository.findOneAndUpdate(
      { transaction_no: transactionNo },
      {
        status: 'failed',
        response_code: responseCode,
        payment_date: new Date(),
      },
      { new: true },
    );
    await this.redisService.delByPattern('cache:payments:*');
    return payment;
  }

  async updatePaymentStatus(
    orderId: string,
    status: string,
    additionalData: any,
  ) {
    const updated = await this.paymentRepository.findOneAndUpdate(
      { transaction_no: orderId },
      { status, ...additionalData, payment_date: new Date() },
      { new: true },
    );
    await this.redisService.delByPattern('cache:payments:*');
    return updated;
  }

  async createLawyerPaymentSplit(payment: Payment) {
    if (!payment.lawyer_id) return null;

    const existing = await this.lawyerPaymentRepository.findByPaymentId(
      payment._id,
    );
    if (existing) return existing;

    const commissionRate = 0.1;
    const commission = Math.round(payment.amount * commissionRate);
    const lawyerAmount = payment.amount - commission;

    const lawyerPayment = await this.lawyerPaymentRepository.create({
      payment_id: payment._id,
      lawyer_id: payment.lawyer_id,
      amount: lawyerAmount,
      commission: commission,
      status: 'success',
      transaction_no: `LP_${payment.transaction_no}`,
      payment_date: new Date(),
      payment_method: payment.payment_method || 'VNPAY',
    });

    await this.redisService.delByPattern('cache:payments:*');
    return lawyerPayment;
  }

  async getLawyerPayments(
    lawyerId: string,
    queryDto?: PaginationQueryDto,
  ): Promise<ResponseDto<any>> {
    const page = Math.max(1, Number(queryDto?.page) || 1);
    const limit = Math.max(1, Number(queryDto?.limit) || 10);

    const filter = {
      lawyer_id: lawyerId,
      ...getDeletedFilter(queryDto?.status_deleted),
    };

    const { data: payments, total } =
      await this.lawyerPaymentRepository.findWithPagination(
        filter,
        page,
        limit,
        { createdAt: -1 },
        'payment_id',
      );

    return ResponseDto.success(
      {
        data: payments,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      'Lawyer payments retrieved successfully',
      HttpStatus.OK,
    );
  }

  async getLawyerIncomeSummary(lawyerId: string): Promise<ResponseDto<any>> {
    const summary =
      await this.lawyerPaymentRepository.getIncomeSummary(lawyerId);

    return ResponseDto.success(
      {
        ...summary,
        commissionRate: '10%',
      },
      'Revenue summary retrieved successfully',
      HttpStatus.OK,
    );
  }

  async getLawyerPaymentsForAdmin(
    userId: string,
    queryDto?: PaginationQueryDto,
  ): Promise<ResponseDto<any>> {
    const page = Math.max(1, Number(queryDto?.page) || 1);
    const limit = Math.max(1, Number(queryDto?.limit) || 10);

    const filter = getDeletedFilter(queryDto?.status_deleted);

    const { data: payments, total } =
      await this.lawyerPaymentRepository.findWithPagination(
        filter,
        page,
        limit,
        { createdAt: -1 },
        [
          { path: 'lawyer_id', select: 'name email phone' },
          { path: 'payment_id' },
        ],
      );

    const totalPlatformCommission = payments
      .filter((p) => p.status === 'success')
      .reduce((sum, p) => sum + p.commission, 0);

    return ResponseDto.success(
      {
        totalCommissionRevenue: totalPlatformCommission,
        totalTransactions: total,
        data: payments,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      'Admin lawyer payments retrieved successfully',
      HttpStatus.OK,
    );
  }

  async getPaymentForAdmin(
    userId: string,
    queryDto?: PaginationQueryDto,
  ): Promise<ResponseDto<PaymentListResponseDataDto>> {
    const page = Math.max(1, Number(queryDto?.page) || 1);
    const limit = Math.max(1, Number(queryDto?.limit) || 10);

    const filter = getDeletedFilter(queryDto?.status_deleted);

    const { data: response, total } =
      await this.paymentRepository.findWithPagination(
        filter,
        page,
        limit,
        { createdAt: -1 },
        ['client_id', 'lawyer_id'],
      );

    return ResponseDto.success(
      this.paymentMapper.toListResponseDto(response, total, page, limit),
      'Payments retrieved successfully',
      HttpStatus.OK,
    );
  }

  async getUserPayment(
    userId: string,
    queryDto?: PaginationQueryDto,
  ): Promise<ResponseDto<PaymentListResponseDataDto>> {
    const page = Math.max(1, Number(queryDto?.page) || 1);
    const limit = Math.max(1, Number(queryDto?.limit) || 10);

    const filter = {
      client_id: userId,
      ...getDeletedFilter(queryDto?.status_deleted),
    };

    const { data: response, total } =
      await this.paymentRepository.findWithPagination(filter, page, limit, {
        createdAt: -1,
      });

    return ResponseDto.success(
      this.paymentMapper.toListResponseDto(response, total, page, limit),
      'Payment history retrieved successfully',
      HttpStatus.OK,
    );
  }

  async getPaymentById(
    id: string,
  ): Promise<ResponseDto<PaymentItemResponseDto>> {
    const response = await this.paymentRepository.findById(id);
    if (!response) {
      throw new NotFoundException('Payment not found');
    }
    return ResponseDto.success(
      this.paymentMapper.toResponseDto(response),
      'Payment details retrieved successfully',
      HttpStatus.OK,
    );
  }

  async getPaymentStatus(txnRef: string): Promise<ResponseDto<any>> {
    const payment = await this.paymentRepository.findOne({
      transaction_no: txnRef,
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return ResponseDto.success(
      { status: payment.status, txnRef: payment.transaction_no },
      'Payment status retrieved successfully',
      HttpStatus.OK,
    );
  }
}
