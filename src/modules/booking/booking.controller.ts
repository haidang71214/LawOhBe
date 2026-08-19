import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import {
  CreateBookingDto,
  ResponseDto,
  BookingItemResponseDto,
  BookingListResponseDataDto,
} from './dto';
import { PaginationQueryDto } from 'libs/dto/pagination.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuthorizerDecorator, RoleDecorator, UserData } from 'libs/decorators';
import { AuthorizedMetadata } from 'libs/interfaces/auth/authorize.response';
import { USER_ROLE } from 'libs/constant';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('booking')
@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @AuthorizerDecorator({ secured: true })
  async createBooking(
    @Body() createBookingDto: CreateBookingDto,
    @UserData() user: AuthorizedMetadata,
  ): Promise<ResponseDto<BookingItemResponseDto>> {
    return this.bookingService.create(createBookingDto, user.userId);
  }

  @Get('/lawyer')
  @AuthorizerDecorator({ secured: true })
  @RoleDecorator(USER_ROLE.LAWYER)
  async getLawyerBookings(
    @UserData() user: AuthorizedMetadata,
    @Query() queryDto: PaginationQueryDto,
  ): Promise<ResponseDto<BookingListResponseDataDto>> {
    return this.bookingService.findAll(user.userId, queryDto);
  }

  @Get('/:id')
  @AuthorizerDecorator({ secured: true })
  async getBookingById(
    @Param('id') id: string,
    @UserData() user: AuthorizedMetadata,
  ): Promise<ResponseDto<BookingItemResponseDto>> {
    return this.bookingService.findOne(id, user.userId);
  }

  @Patch('/:id/accept')
  @AuthorizerDecorator({ secured: true })
  @RoleDecorator(USER_ROLE.LAWYER)
  async acceptBooking(
    @UserData() user: AuthorizedMetadata,
    @Param('id') id: string,
  ): Promise<ResponseDto<BookingItemResponseDto>> {
    return this.bookingService.acceptBooking(user.userId, id);
  }

  @Patch('/:id/reject')
  @AuthorizerDecorator({ secured: true })
  @RoleDecorator(USER_ROLE.LAWYER)
  async rejectBooking(
    @Param('id') id: string,
    @UserData() user: AuthorizedMetadata,
  ): Promise<ResponseDto<null>> {
    return this.bookingService.rejectBooking(user.userId, id);
  }

  @Delete('/:id')
  @AuthorizerDecorator({ secured: true })
  async cancelBooking(
    @UserData() user: AuthorizedMetadata,
    @Param('id') id: string,
  ): Promise<ResponseDto<null>> {
    return this.bookingService.cancelBooking(user.userId, id);
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM, {
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async autoCleanRejectedBookings() {
    try {
      await this.bookingService.autoClearBooking();
    } catch (error: any) {
      console.error('Error auto-cleaning rejected bookings:', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM, {
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async sendRequestForClient() {
    try {
      console.log(
        `[${new Date().toISOString()}] Automatically sending review request emails at 1 AM...`,
      );
      await this.bookingService.sendEmailsForClient();
    } catch (error) {
      console.error('Error auto-sending emails:', error);
    }
  }
}
