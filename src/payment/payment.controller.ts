import { Controller, Get, Post, Body, Query, Res, HttpException, HttpStatus, Req, UseGuards, BadRequestException, Param } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Response } from 'express';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/stratergy/jwt.guard';
import { Payment } from 'src/config/database.config';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { AuthGuard } from '@nestjs/passport';
import { URL_PRODUCTION } from 'src/main';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    @InjectModel(Payment.name) private PaymentModel: Model<Payment>
  ) {}

  @Post('create-payment-url')
  async createPaymentUrl(@Body() createPaymentDto: CreatePaymentDto, @Res() res: Response) {
    try {
      const { amount, orderInfo, orderType, bankCode, clientId, lawyerId,bookingId } = createPaymentDto;
      const { paymentUrl, txnRef } = await this.paymentService.createPaymentUrl(amount, orderInfo, orderType, bankCode, clientId, lawyerId,bookingId);
      console.log(clientId, lawyerId);
  // thêm bookingId trong mayment 
      const existingSuccessPayment = await this.PaymentModel.findOne({ client_id: clientId, lawyer_id: lawyerId,booking_id:bookingId, status: 'success' });
      if (existingSuccessPayment) {
        throw new BadRequestException('Đã có giao dịch thành công cho client và lawyer này.');
      }
  
      const existingPayment = await this.PaymentModel.findOne({ client_id: clientId, lawyer_id: lawyerId,booking_id:bookingId });
      if (existingPayment) {
        if (existingPayment.status !== 'failed') {
          await this.PaymentModel.updateOne(
            { transaction_no: txnRef },
            { $set: { 
              orderInfo: orderInfo, 
              updated_at: new Date(),
              amount: amount,
              client_id: clientId, // Sửa ở đây
              lawyer_id: lawyerId, // Sửa ở đây
              booking_id:bookingId
            } }
          );
        }
      } else {
        const newPayment = await this.PaymentModel.create({
          transaction_no: txnRef,
          amount: amount,
          client_id: clientId, // Sửa ở đây
          lawyer_id: lawyerId, // Sửa ở đây
          booking_id:bookingId, // sửa ở đây nữa, vấn đề là nó đang không tạo mới ở ngoài, nó tạo mới ở trong
          status: 'pending',
          created_at: new Date(),
          orderInfo: orderInfo,
        });
        console.log('Created new payment record:', newPayment);
      }
  
      console.log('Payment URL generated:', paymentUrl);
      return res.json({ paymentUrl });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('vnpay-return')
  async handleVnpayReturn(@Query() query: any, @Res() res: Response) {
    try {
      const isValid = this.paymentService.verifyVnpayReturn(query);
      const responseCode = query['vnp_ResponseCode'] || '00';
      console.log('Is valid:', isValid);
      console.log('responseCode:', responseCode);
      console.log('vnp_TxnRef from query:', query['vnp_TxnRef']);
// đây, vấn đề là ở đây, nó đang tạo 1 cái transacttion mới, giờ cái chỗ này cần lấy cái trans cũ truyền vô
      if (isValid && responseCode === '00') {
        const payment = await this.PaymentModel.findOneAndUpdate(
          { transaction_no: query['vnp_TxnRef'] },
          { status: 'success', payment_date: new Date() },
          { new: true }
        );

        console.log('Payment record found and updated:', payment);

        if (!payment) {
          throw new BadRequestException('Payment not found for transaction_no: ' + query['vnp_TxnRef']);
        }
       
        return res.redirect(`${URL_PRODUCTION}/payment-result?status=success&code=${responseCode}&txnRef=${query['vnp_TxnRef']}`);
      } else {
        await this.PaymentModel.findOneAndUpdate(
          { transaction_no: query['vnp_TxnRef'] },
          { status: 'failed', payment_date: new Date() }
        );
        return res.redirect(`${URL_PRODUCTION}/payment-result?status=failed&code=${responseCode || '97'}&txnRef=${query['vnp_TxnRef']}`);
      }
    } catch (error) {
      console.log('Error:', error.message);
      return res.redirect(`${URL_PRODUCTION}/payment-result?status=error&message=${encodeURIComponent('Lỗi khi xử lý phản hồi VNPAY: ' + error.message)}`);
    }
  }

  @Get('vnpay-ipn')
  async handleVnpayIpn(@Query() query: any, @Res() res: Response) {
    const isValid = this.paymentService.verifyVnpayReturn(query);
    if (isValid) {
      const orderId = query['vnp_TxnRef'];
      const rspCode = query['vnp_ResponseCode'] || '00';
      return res.status(200).json({ RspCode: '00', Message: 'Success' });
    } else {
      return res.status(200).json({ RspCode: '97', Message: 'Fail checksum' });
    }
  }

  
  @Get('get-payment-status/:txnRef')
  async getPaymentStatus(@Param('txnRef') txnRef: string) {
    try {
      const payment = await this.PaymentModel.findOne({ transaction_no: txnRef });
      if (!payment) {
        throw new BadRequestException('Payment not found');
      }
      return {
        status: payment.status,
        txnRef: payment.transaction_no,
      };
    } catch (error) {
      throw new BadRequestException('Lỗi khi lấy trạng thái thanh toán: ' + error.message);
    }
  }

  @Get('/getPaymentForAdmin')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getPaymentForAdmin(@Res() res: Response, @Req() req) {
    try {
      const { userId } = req.user;
      const data = await this.paymentService.getPaymentForAdmin(userId);
      return res.json({ data });
    } catch (error) {
      throw new Error(error);
    }
  }
  @Get('/userGetPayment')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getShiitingUser(
    @Req() req,
  ){
    try {
      const{userId} = req.user
      const data = await this.paymentService.getUserPayment(userId)
      return data
    } catch (error) {
      throw new Error()
    }
  }
  @Get('/getPaymentSuccessOrFail/:id')
  async getFuckingPayment(
    @Param('id') id:String,
    @Res() res:Response
  ){
    try {
      const response = await this.paymentService.getPaymentSuccessOrFail(id);
      return res.status(response.status).json(response.data) 
    } catch (error) {
      throw new Error(error)
    }
  }
}