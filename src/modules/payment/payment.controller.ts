import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  HttpStatus,
  BadRequestException,
  Param,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import {
  CreatePaymentDto,
  ResponseDto,
  PaymentItemResponseDto,
  PaymentListResponseDataDto,
} from './dto';
import { PaginationQueryDto } from 'libs/dto/pagination.dto';
import { Response } from 'express';
import { AuthorizerDecorator, RoleDecorator, UserData } from 'libs/decorators';
import { AuthorizedMetadata } from 'libs/interfaces/auth/authorize.response';
import { USER_ROLE } from 'libs/constant';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('/create-url')
  async createPaymentUrl(
    @Body() createPaymentDto: CreatePaymentDto,
  ): Promise<ResponseDto<{ paymentUrl: string }>> {
    const {
      amount,
      orderInfo,
      orderType,
      bankCode,
      clientId,
      lawyerId,
      bookingId,
    } = createPaymentDto;

    const { paymentUrl } = await this.paymentService.createPaymentUrl(
      amount,
      orderInfo,
      orderType,
      bankCode,
      clientId,
      lawyerId,
      bookingId,
    );

    return ResponseDto.success(
      { paymentUrl },
      'Payment URL created successfully',
      HttpStatus.OK,
    );
  }

  @Get('/vnpay-return')
  async handleVnpayReturn(@Query() query: any, @Res() res: Response) {
    try {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      const isValid = this.paymentService.verifyVnpayReturn(query);
      const responseCode = query['vnp_ResponseCode'] || '00';
      const txnRef = query['vnp_TxnRef'];

      if (isValid && responseCode === '00') {
        const payment = await this.paymentService.processSuccessfulPayment(
          txnRef,
          responseCode,
        );

        if (!payment) {
          throw new BadRequestException(
            'Payment not found for transaction_no: ' + txnRef,
          );
        }

        return res.redirect(
          `${clientUrl}/payment-result?status=success&code=${responseCode}&txnRef=${txnRef}`,
        );
      } else {
        await this.paymentService.processFailedPayment(
          txnRef,
          responseCode || '97',
        );
        return res.redirect(
          `${clientUrl}/payment-result?status=failed&code=${responseCode || '97'}&txnRef=${txnRef}`,
        );
      }
    } catch (error: any) {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      return res.redirect(
        `${clientUrl}/payment-result?status=error&message=${encodeURIComponent('Error handling VNPay response: ' + error.message)}`,
      );
    }
  }

  @Get('/vnpay-ipn')
  async handleVnpayIpn(@Query() query: any) {
    const isValid = this.paymentService.verifyVnpayReturn(query);
    if (isValid) {
      const orderId = query['vnp_TxnRef'];
      const rspCode = query['vnp_ResponseCode'] || '00';
      if (rspCode === '00') {
        await this.paymentService.processSuccessfulPayment(orderId, rspCode);
      } else {
        await this.paymentService.processFailedPayment(orderId, rspCode);
      }
      return { RspCode: '00', Message: 'Success' };
    } else {
      return { RspCode: '97', Message: 'Fail checksum' };
    }
  }

  @Get('/status/:txnRef')
  async getPaymentStatus(
    @Param('txnRef') txnRef: string,
  ): Promise<ResponseDto<any>> {
    return this.paymentService.getPaymentStatus(txnRef);
  }

  @Get('/admin')
  @AuthorizerDecorator({ secured: true })
  @RoleDecorator(USER_ROLE.ADMIN)
  async getAdminPayments(
    @UserData() user: AuthorizedMetadata,
    @Query() queryDto: PaginationQueryDto,
  ): Promise<ResponseDto<PaymentListResponseDataDto>> {
    return this.paymentService.getPaymentForAdmin(user.userId, queryDto);
  }

  @Get('/my-payments')
  @AuthorizerDecorator({ secured: true })
  async getUserPayments(
    @UserData() user: AuthorizedMetadata,
    @Query() queryDto: PaginationQueryDto,
  ): Promise<ResponseDto<PaymentListResponseDataDto>> {
    return this.paymentService.getUserPayment(user.userId, queryDto);
  }

  @Get('/lawyer-payments')
  @AuthorizerDecorator({ secured: true })
  @RoleDecorator(USER_ROLE.LAWYER)
  async getLawyerPayments(
    @UserData() user: AuthorizedMetadata,
    @Query() queryDto: PaginationQueryDto,
  ): Promise<ResponseDto<any>> {
    return this.paymentService.getLawyerPayments(user.userId, queryDto);
  }

  @Get('/lawyer-income')
  @AuthorizerDecorator({ secured: true })
  @RoleDecorator(USER_ROLE.LAWYER)
  async getLawyerIncomeSummary(
    @UserData() user: AuthorizedMetadata,
  ): Promise<ResponseDto<any>> {
    return this.paymentService.getLawyerIncomeSummary(user.userId);
  }

  @Get('/admin/lawyer-commissions')
  @AuthorizerDecorator({ secured: true })
  @RoleDecorator(USER_ROLE.ADMIN)
  async getLawyerCommissionsForAdmin(
    @UserData() user: AuthorizedMetadata,
    @Query() queryDto: PaginationQueryDto,
  ): Promise<ResponseDto<any>> {
    return this.paymentService.getLawyerPaymentsForAdmin(user.userId, queryDto);
  }

  @Get('/:id')
  async getPaymentById(
    @Param('id') id: string,
  ): Promise<ResponseDto<PaymentItemResponseDto>> {
    return this.paymentService.getPaymentById(id);
  }
}
