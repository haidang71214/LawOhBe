import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as qs from 'qs';
import * as crypto from 'crypto';
import { Booking, LawyerPayment, Payment } from 'src/config/database.config';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class PaymentService {
  constructor(
    private configService: ConfigService,
    @InjectModel(Booking.name) private BookingModel: Model<Booking>,
    @InjectModel(Payment.name) private PaymentModel: Model<Payment>,
    @InjectModel(LawyerPayment.name) private LawyerPaymentModel: Model<LawyerPayment>,
    private readonly authService: AuthService
  ) {}

  async createPaymentUrl(
    amount: number,
    orderInfo: string,
    orderType: string,
    bankCode?: string,
    clientId?: string,
    lawyerId?: string,
    bookingId?:string
  ): Promise<{ paymentUrl: string; txnRef: string }> {
    const tmnCode = process.env.VNP_TMN_CODE;
    const secretKey = process.env.VNP_HASH_SECRET;
    const vnpUrl = process.env.VNP_URL;
    const returnUrl = process.env.VNP_RETURN_URL;
    console.log('Config:', { secretKey, vnpUrl });

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

    console.log('vnp_Params:', vnp_Params);
    console.log('signData:', signData);
    console.log('vnp_SecureHash:', signed);
    console.log('Generated URL:', `${vnpUrl}?${qs.stringify(sortedParams, { encode: false })}`);

    await this.PaymentModel.findOneAndUpdate({booking_id:bookingId},{
      transaction_no:orderId
    })
    
    return { paymentUrl: `${vnpUrl}?${qs.stringify(sortedParams, { encode: false })}`, txnRef: orderId };
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
      throw new Error('VNP_HASH_SECRET is not defined in the environment variables');
    }

    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    console.log('Received vnp_SecureHash:', secureHash);
    console.log('Computed vnp_SecureHash:', signed);
    console.log('Sign data:', signData);
    console.log('Query params:', sortedParams);
    console.log('Is valid:', secureHash === signed);

    return secureHash === signed;
  }

  private padZero(num: number): string {
    return num < 10 ? `0${num}` : num.toString();
  }

  async updatePaymentStatus(orderId: string, status: string, additionalData: any) {
    return await this.PaymentModel.findOneAndUpdate(
      { transaction_no: orderId },
      { status, ...additionalData, payment_date: new Date() },
      { new: true }
    );
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
  async getUserPayment(userId:string){
    try {
      console.log(userId);
      const respone =  await this.PaymentModel.find({client_id:userId})
      console.log(respone);
      
      return respone  
    } catch (error) {
      throw new Error(error)
    }
  }
  async getPaymentSuccessOrFail(id:String) {
    try {
      const response = await this.PaymentModel.findById(id)
      return {
        status:200,
        data:response
      }
    } catch (error) {
      throw new Error(error)
    }
  }
}