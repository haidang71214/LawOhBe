import { ForbiddenException, Injectable } from '@nestjs/common';
import * as qs from 'qs';
import * as crypto from 'crypto';
import { LawyerPayment, Payment } from 'src/config/database.config';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(Payment.name) private PaymentModel: Model<Payment>,
    @InjectModel(LawyerPayment.name)
    private LawyerPaymentModel: Model<LawyerPayment>,
    private readonly authService: AuthService,
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
      throw new Error('Missing VNPay configuration');
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

    const sortedParams = Object.keys(vnp_Params)
      .sort()
      .reduce((result, key) => {
        result[key] = encodeURIComponent(vnp_Params[key]).replace(/%20/g, '+');
        return result;
      }, {});

    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    sortedParams['vnp_SecureHash'] = signed;

    await this.PaymentModel.findOneAndUpdate(
      { booking_id: bookingId },
      {
        transaction_no: orderId,
      },
    );

    return {
      paymentUrl: `${vnpUrl}?${qs.stringify(sortedParams, { encode: false })}`,
      txnRef: orderId,
    };
  }

  verifyVnpayReturn(query: any): boolean {
    const secureHash = query['vnp_SecureHash'];
    delete query['vnp_SecureHash'];
    delete query['vnp_SecureHashType'];

    const sortedParams = Object.keys(query)
      .sort()
      .reduce((result, key) => {
        result[key] = encodeURIComponent(query[key]).replace(/%20/g, '+');
        return result;
      }, {});

    const secretKey = process.env.VNP_HASH_SECRET;
    if (!secretKey) {
      throw new Error(
        'VNP_HASH_SECRET is not defined in the environment variables',
      );
    }

    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    return secureHash === signed;
  }

  private padZero(num: number): string {
    return num < 10 ? `0${num}` : num.toString();
  }

  async updatePaymentStatus(
    orderId: string,
    status: string,
    additionalData: any,
  ) {
    return await this.PaymentModel.findOneAndUpdate(
      { transaction_no: orderId },
      { status, ...additionalData, payment_date: new Date() },
      { new: true },
    );
  }

  // Tách hoa hồng khi thanh toán thành công (90% cho luật sư, 10% nền tảng)
  async createLawyerPaymentSplit(payment: Payment) {
    if (!payment.lawyer_id) return null;

    const existing = await this.LawyerPaymentModel.findOne({
      payment_id: payment._id,
    });
    if (existing) return existing;

    const commissionRate = 0.1; // 10% hoa hồng nền tảng
    const commission = Math.round(payment.amount * commissionRate);
    const lawyerAmount = payment.amount - commission;

    const lawyerPayment = await this.LawyerPaymentModel.create({
      payment_id: payment._id,
      lawyer_id: payment.lawyer_id,
      amount: lawyerAmount,
      commission: commission,
      status: 'success',
      transaction_no: `LP_${payment.transaction_no}`,
      payment_date: new Date(),
      payment_method: payment.payment_method || 'VNPAY',
    });

    return lawyerPayment;
  }

  // Lấy danh sách thanh toán nhận được của luật sư
  async getLawyerPayments(lawyerId: string) {
    const isLawyer = await this.authService.checkLawyer(lawyerId);
    if (!isLawyer) {
      throw new ForbiddenException('Chỉ luật sư mới có quyền truy cập');
    }

    const payments = await this.LawyerPaymentModel.find({ lawyer_id: lawyerId })
      .populate('payment_id')
      .sort({ createdAt: -1 });

    return {
      status: 200,
      total: payments.length,
      data: payments,
    };
  }

  // Thống kê thu nhập & hoa hồng của luật sư
  async getLawyerIncomeSummary(lawyerId: string) {
    const isLawyer = await this.authService.checkLawyer(lawyerId);
    if (!isLawyer) {
      throw new ForbiddenException('Chỉ luật sư mới có quyền truy cập');
    }

    const payments = await this.LawyerPaymentModel.find({
      lawyer_id: lawyerId,
      status: 'success',
    });
    const totalGross = payments.reduce(
      (sum, p) => sum + (p.amount + p.commission),
      0,
    );
    const totalNet = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalCommission = payments.reduce((sum, p) => sum + p.commission, 0);

    return {
      status: 200,
      summary: {
        totalTransactions: payments.length,
        totalGrossRevenue: totalGross,
        totalNetIncome: totalNet,
        totalPlatformCommission: totalCommission,
        commissionRate: '10%',
      },
    };
  }

  // Admin xem toàn bộ danh sách tách hoa hồng và tổng doanh thu hoa hồng
  async getLawyerPaymentsForAdmin(userId: string) {
    const isAdmin = await this.authService.checkAdmin(userId);
    if (!isAdmin) {
      throw new ForbiddenException('Chỉ quản trị viên mới có quyền truy cập');
    }

    const payments = await this.LawyerPaymentModel.find()
      .populate('lawyer_id', 'name email phone')
      .populate('payment_id')
      .sort({ createdAt: -1 });

    const totalPlatformCommission = payments
      .filter((p) => p.status === 'success')
      .reduce((sum, p) => sum + p.commission, 0);

    return {
      status: 200,
      totalCommissionRevenue: totalPlatformCommission,
      totalTransactions: payments.length,
      data: payments,
    };
  }

  async getPaymentForAdmin(userId: string) {
    try {
      const checkAdmin = await this.authService.checkAdmin(userId);
      if (checkAdmin) {
        const response = await this.PaymentModel.find()
          .populate('client_id')
          .populate('lawyer_id');
        return response;
      }
    } catch (error) {
      throw new Error(error);
    }
  }

  async getUserPayment(userId: string) {
    try {
      const response = await this.PaymentModel.find({ client_id: userId });
      return response;
    } catch (error) {
      throw new Error(error);
    }
  }

  async getPaymentSuccessOrFail(id: string) {
    try {
      const response = await this.PaymentModel.findById(id);
      return {
        status: 200,
        data: response,
      };
    } catch (error) {
      throw new Error(error);
    }
  }
}
