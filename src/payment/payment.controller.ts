import { Controller, Get, Post, Body, Query, Res, HttpException, HttpStatus, Req, UseGuards, BadRequestException, Param } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Response } from 'express';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/stratergy/jwt.guard';
import { Payment } from 'src/config/database.config';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    @InjectModel(Payment.name) private PaymentModel: Model<Payment>
  ) {}

  @Post('create-payment-url')
  async createPaymentUrl(@Body() createPaymentDto: CreatePaymentDto, @Res() res: Response) {
    try {
      const { amount, orderInfo, orderType, bankCode, clientId, lawyerId } = createPaymentDto;
      const { paymentUrl, txnRef } = await this.paymentService.createPaymentUrl(amount, orderInfo, orderType, bankCode, clientId, lawyerId);

      // Kiểm tra xem bản ghi đã tồn tại chưa
      const existingPayment = await this.PaymentModel.findOne({ client_id:clientId,lawyer_id:lawyerId });
      if (existingPayment) {
        // Nếu đã tồn tại và chưa hoàn tất, cập nhật thông tin (ví dụ: orderInfo)
        if (existingPayment.status !== 'success' && existingPayment.status !== 'failed') {
          await this.PaymentModel.updateOne(
            { transaction_no: txnRef },
            { $set: { orderInfo: orderInfo, updated_at: new Date() } }
          );
        } else {
          throw new BadRequestException('Giao dịch đã hoàn tất, không thể cập nhật.');
        }
      } else {
        // Nếu chưa tồn tại, tạo mới
        const newPayment = await this.PaymentModel.create({
          transaction_no: txnRef,
          amount: amount,
          client_id: clientId,
          lawyer_id: lawyerId,
          status: 'pending',
          created_at: new Date(),
          orderInfo: orderInfo, // Lưu orderInfo ban đầu
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

        return res.redirect(`http://localhost:3000/payment-result?status=success&code=${responseCode}&txnRef=${query['vnp_TxnRef']}`);
      } else {
        await this.PaymentModel.findOneAndUpdate(
          { transaction_no: query['vnp_TxnRef'] },
          { status: 'failed', payment_date: new Date() }
        );
        return res.redirect(`http://localhost:3000/payment-result?status=failed&code=${responseCode || '97'}&txnRef=${query['vnp_TxnRef']}`);
      }
    } catch (error) {
      console.log('Error:', error.message);
      return res.redirect(`http://localhost:3000/payment-result?status=error&message=${encodeURIComponent('Lỗi khi xử lý phản hồi VNPAY: ' + error.message)}`);
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
}