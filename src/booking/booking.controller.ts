import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Res, UseGuards } from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Response } from 'express';
import { ApiBadGatewayResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/stratergy/jwt.guard';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmailService } from 'src/email/email.service';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService,
    private readonly mailService:EmailService
  ) {}

  @Post('/userCreateBooking')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createBookingDto: CreateBookingDto,
  @Req() req,
  @Res() res:Response
) {
  try {
    const {userId} = req.user
    const respone = await this.bookingService.create(createBookingDto, userId)
    return res.status(respone.res).json(respone.message)
  } catch (error) {
    throw new Error(error)
  }
    
  }
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('/lawyerAcceptBooking/:clientId/:booking_id')
  async acceptBooking(
    @Req() req, // admin
    @Res() res:Response,
    // params của user
    @Param('clientId') client_id: string,
    @Param('booking_id') booking_id :string // lấy thêm cả booking id
  ){
    const {userId} = req.user
    try {
      try {
        const response = await this.bookingService.acceptBooking(userId,client_id,booking_id)
        return res.status(response.status).json(response.message)
      } catch (error) {
        throw new Error(error)
      }
    } catch (error) {
      throw new Error(error)
    }
  }
// api để lấy cái list accept hoặc request cho người dùng
  @Get("/LawyerGetListBooking")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findAll(
@Req() req,
@Res() res:Response
  ){
    const{userId} = req.user
    try {
      const response = await this.bookingService.findAll(userId)
      return res.status(response.status).json(response.results)
    } catch (error) {
      throw new Error(error)
    }
  }
// api lấy chi tiết cái booking của user
// đảm bảo người lấy là lawyer, id là id của user
  @Get('detailUserBooking/:id')
  async findOne(@Param('id') id: string,
  @Res() res:Response,
  @Req() req
) {
    try {
      const {userId} = req.user
      const result = await this.bookingService.findOne(id,userId);
      return res.status(result.status).json(result.response)
    } catch (error) {
      throw new Error(error)
    }
  }
// rejectBooking nhận 1 clientId
  @Patch('rejectBooking/:clientId/:booking_id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async DeleteBooking(@Param('clientId') client_id: string,
  @Param('booking_id') booking_id :string,
@Res() res:Response,
@Req() req
) {
   try {
    const {userId} = req.user
    const response = await this.bookingService.DeleteBooking(userId,client_id,booking_id);
    return res.status(response.status).json(response.message)
   } catch (error) {
    throw new Error()
   }
  }
// quá thời gian 
// Hủy lịch đăng kí
@Delete('/userCancelBooking/:id')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
async userCancel(
@Req() req,
@Res() res:Response,
@Param('id') id: string
){
try {
  const{userId} = req.user
  const response = await this.bookingService.cancelBooking(userId,id)
  return res.status(response.status).json(response.message)
} catch (error) {
  throw new Error(error)
}
}
// accept cũng làm tương tự, đồng thời gửi mail
@Cron(CronExpression.EVERY_DAY_AT_1AM, {
  timeZone: 'Asia/Ho_Chi_Minh', // Múi giờ Việt Nam
})
async autoCleanRejectedBookings(@Res() res:Response) {
  try {
    const response = await this.bookingService.autoClearBooking()
    return res.status(response.status).json(response.message)
  } catch (error) {
    throw new Error(error)
  }
}

// sau khi date end xong thì nó tự gửi request review tới mail của client
// Tác vụ gửi email yêu cầu review
@Cron(CronExpression.EVERY_DAY_AT_1AM, {
  timeZone: 'Asia/Ho_Chi_Minh',
})
async sendRequestForClient(@Res() res:Response) {
  try {
    console.log(`[${new Date().toISOString()}] Tự động gửi email yêu cầu review lúc 1h sáng...`);

    // Gọi phương thức từ BookingService để lấy danh sách booking cần review
     await this.bookingService.sendEmailsForClient();
    return res.status(200).json({message:"Đã thay đổi trạng thái của user đồng thời gửi request review"})
  } catch (error) {
    console.error('Lỗi khi tự động gửi email:', error);
  }
}
}
