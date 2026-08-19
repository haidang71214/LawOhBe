import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateBookingDto,
  ResponseDto,
  BookingItemResponseDto,
  BookingListResponseDataDto,
} from './dto';
import { PaginationQueryDto } from 'libs/dto/pagination.dto';
import { getDeletedFilter } from 'libs/utils/pagination.util';
import {
  CustomPrice,
  CustomPriceModelName,
  User,
  UserModelName,
} from 'libs/schemas';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { EmailService } from 'src/shared/email/email.service';
import { RedisService, REDIS_KEYS } from 'src/shared/redis';
import { BookingRepository } from './repository/booking.repository';
import { BookingMapper } from './mapper/booking.mapper';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class BookingService {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly bookingMapper: BookingMapper,
    private readonly mailService: EmailService,
    private readonly redisService: RedisService,
    private readonly notificationService: NotificationService,
    @InjectModel(UserModelName) private UserModel: Model<User>,
    @InjectModel(CustomPriceModelName)
    private CustomPriceModel: Model<CustomPrice>,
  ) {}

  async create(
    createBookingDto: CreateBookingDto,
    userId: string,
  ): Promise<ResponseDto<BookingItemResponseDto>> {
    const { lawyer_id, booking_end, booking_start, typeBooking, note } =
      createBookingDto;

    // Redis Distributed Lock chống Double-Booking
    const lockKey = REDIS_KEYS.BOOKING_LOCK(
      lawyer_id,
      new Date(booking_start).toISOString(),
    );
    const isLocked = await this.redisService.acquireLock(lockKey, 5);
    if (!isLocked) {
      throw new ConflictException(
        'This lawyer slot is currently being processed by another user. Please try again in a few seconds.',
      );
    }

    try {
      const findCustomPriceByLawyer = await this.CustomPriceModel.findOne({
        lawyer_id: lawyer_id,
        type: typeBooking,
      });

      if (!findCustomPriceByLawyer) {
        throw new NotFoundException(
          'Price not found for this consultation type.',
        );
      }

      const startDate = new Date(booking_start);
      const endDate = new Date(booking_end);

      if (endDate <= startDate) {
        throw new BadRequestException('End time must be after start time.');
      }
      if (startDate <= new Date()) {
        throw new BadRequestException(
          'Start time must be at least from today.',
        );
      }

      const timeDiff = endDate.getTime() - startDate.getTime();
      const hours = Math.max(1, Math.ceil(timeDiff / (1000 * 3600)));
      const totalAmount = findCustomPriceByLawyer.price * hours;

      const existingBooking =
        await this.bookingRepository.findConflictingBooking(
          lawyer_id,
          startDate,
          endDate,
        );

      if (existingBooking) {
        throw new ConflictException(
          'The lawyer is already booked for this time slot.',
        );
      }

      const booking = await this.bookingRepository.create({
        client_id: userId,
        lawyer_id,
        booking_start: startDate,
        booking_end: endDate,
        typeBooking,
        note,
        status: 'pending',
        income: totalAmount,
        amount: totalAmount,
      });

      // Xóa cache booking liên quan
      await this.redisService.delByPattern(`cache:bookings:${lawyer_id}:*`);

      // Gửi thông báo cho Luật sư
      try {
        const clientUser = await this.UserModel.findById(userId);
        await this.notificationService.createNotification({
          recipient_id: lawyer_id,
          sender_id: userId,
          title: 'Yêu cầu đặt lịch mới',
          content: `Khách hàng ${clientUser?.name || ''} vừa đặt lịch tư vấn (${typeBooking}).`,
          type: 'BOOKING',
          metadata: {
            reference_id: booking._id.toString(),
            typeBooking,
          },
        });
      } catch (notiError) {
        console.error('Error sending notification for new booking:', notiError);
      }

      return ResponseDto.success(
        this.bookingMapper.toResponseDto(booking),
        'Booking created successfully',
        HttpStatus.OK,
      );
    } finally {
      await this.redisService.releaseLock(lockKey);
    }
  }

  async findAll(
    lawyerId: string,
    queryDto?: PaginationQueryDto,
  ): Promise<ResponseDto<BookingListResponseDataDto>> {
    const page = Math.max(1, Number(queryDto?.page) || 1);
    const limit = Math.max(1, Number(queryDto?.limit) || 10);

    const filter: any = {
      lawyer_id: lawyerId,
      ...getDeletedFilter(queryDto?.status_deleted),
    };

    const { data: bookings, total } =
      await this.bookingRepository.findWithPagination(
        filter,
        page,
        limit,
        { createdAt: -1 },
        { path: 'client_id', select: 'name email phone avartar_url' },
      );

    return ResponseDto.success(
      this.bookingMapper.toListResponseDto(bookings, total, page, limit),
      'Bookings retrieved successfully',
      HttpStatus.OK,
    );
  }

  async findOne(
    id: string,
    userId?: string,
  ): Promise<ResponseDto<BookingItemResponseDto>> {
    const booking = await this.bookingRepository.findById(id, [
      { path: 'client_id', select: 'name email phone avartar_url' },
      { path: 'lawyer_id', select: 'name email phone avartar_url' },
    ]);

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return ResponseDto.success(
      this.bookingMapper.toResponseDto(booking),
      'Booking details retrieved successfully',
      HttpStatus.OK,
    );
  }

  async acceptBooking(
    lawyerId: string,
    bookingId: string,
  ): Promise<ResponseDto<BookingItemResponseDto>> {
    const bookingData = await this.bookingRepository.findOneAndUpdate(
      {
        lawyer_id: lawyerId,
        _id: new Types.ObjectId(bookingId),
      },
      {
        status: 'accept',
      },
      { new: true },
    );

    if (!bookingData) {
      throw new NotFoundException('Booking not found');
    }

    // Xóa cache booking
    await this.redisService.delByPattern(`cache:bookings:${lawyerId}:*`);

    const clientData = await this.UserModel.findById(bookingData?.client_id);
    const lawyerData = await this.UserModel.findById(bookingData?.lawyer_id);

    if (clientData?.email) {
      try {
        await this.mailService.sendMail(
          clientData.email,
          `Lawyer ${lawyerData?.name} has accepted your booking`,
          'Please proceed with payment and prepare relevant documents.',
        );
      } catch (mailError) {
        console.error('Error sending email:', mailError);
      }
    }

    // Gửi thông báo realtime cho Khách hàng
    try {
      await this.notificationService.createNotification({
        recipient_id: bookingData.client_id.toString(),
        sender_id: lawyerId,
        title: 'Lịch hẹn đã được chấp nhận',
        content: `Luật sư ${lawyerData?.name || ''} đã đồng ý lịch hẹn tư vấn của bạn.`,
        type: 'BOOKING',
        metadata: {
          reference_id: bookingData._id.toString(),
        },
      });
    } catch (notiError) {
      console.error('Error sending accept booking notification:', notiError);
    }

    return ResponseDto.success(
      this.bookingMapper.toResponseDto(bookingData),
      'Booking accepted successfully',
      HttpStatus.OK,
    );
  }

  async rejectBooking(
    lawyerId: string,
    bookingId: string,
  ): Promise<ResponseDto<null>> {
    const bookingData = await this.bookingRepository.findOneAndUpdate(
      {
        lawyer_id: lawyerId,
        _id: new Types.ObjectId(bookingId),
      },
      {
        status: 'reject',
      },
    );

    if (!bookingData) {
      throw new NotFoundException('Booking not found');
    }

    // Xóa cache booking
    await this.redisService.delByPattern(`cache:bookings:${lawyerId}:*`);

    const clientData = await this.UserModel.findById(bookingData?.client_id);
    const lawyerData = await this.UserModel.findById(bookingData?.lawyer_id);

    if (clientData?.email) {
      try {
        await this.mailService.sendMail(
          clientData.email,
          `Lawyer ${lawyerData?.name} has declined your booking`,
          'Please search for another suitable lawyer.',
        );
      } catch (mailError) {
        console.error('Error sending email:', mailError);
      }
    }

    // Gửi thông báo realtime cho Khách hàng
    try {
      await this.notificationService.createNotification({
        recipient_id: bookingData.client_id.toString(),
        sender_id: lawyerId,
        title: 'Lịch hẹn bị từ chối',
        content: `Luật sư ${lawyerData?.name || ''} đã từ chối lịch hẹn tư vấn của bạn.`,
        type: 'BOOKING',
        metadata: {
          reference_id: bookingData._id.toString(),
        },
      });
    } catch (notiError) {
      console.error('Error sending reject booking notification:', notiError);
    }

    return ResponseDto.success(
      null,
      'Booking rejected successfully',
      HttpStatus.OK,
    );
  }

  async cancelBooking(userId: string, id: string): Promise<ResponseDto<null>> {
    const checkStatus = await this.bookingRepository.findOne({
      client_id: userId,
      _id: id,
    });

    if (!checkStatus) {
      throw new NotFoundException('Booking not found');
    }

    if (checkStatus.status !== 'pending') {
      throw new ConflictException(
        `Booking cannot be cancelled directly because it is in '${checkStatus.status}' status. Please contact admin for support.`,
      );
    }

    await this.bookingRepository.findOneAndUpdate(
      { client_id: userId, _id: id },
      { status: 'cancelled', isDeleted: true, deletedAt: new Date() },
      { new: true },
    );

    // Xóa cache booking
    await this.redisService.delByPattern(`cache:bookings:*`);

    // Gửi thông báo cho Luật sư rằng khách hàng đã hủy lịch
    try {
      const clientData = await this.UserModel.findById(userId);
      if (checkStatus.lawyer_id) {
        await this.notificationService.createNotification({
          recipient_id: checkStatus.lawyer_id.toString(),
          sender_id: userId,
          title: 'Khách hàng đã hủy lịch hẹn',
          content: `Khách hàng ${clientData?.name || ''} đã hủy yêu cầu tư vấn.`,
          type: 'BOOKING',
          metadata: {
            reference_id: id,
          },
        });
      }
    } catch (notiError) {
      console.error('Error sending cancel booking notification:', notiError);
    }

    return ResponseDto.success(
      null,
      'Booking cancelled successfully',
      HttpStatus.OK,
    );
  }

  async autoClearBooking(): Promise<ResponseDto<null>> {
    await this.bookingRepository.updateMany(
      { status: 'reject' },
      { isDeleted: true, deletedAt: new Date() },
    );
    await this.redisService.delByPattern(`cache:bookings:*`);
    return ResponseDto.success(
      null,
      'Rejected bookings cleaned successfully',
      HttpStatus.OK,
    );
  }

  async sendEmailsForClient(): Promise<void> {
    try {
      const currentDate = new Date();

      const acceptedBookings = await this.bookingRepository.find({
        status: 'accept',
      });

      for (const booking of acceptedBookings) {
        const bookingEnd = new Date(booking.booking_end);
        if (bookingEnd < currentDate) {
          await this.bookingRepository.findByIdAndUpdate(booking._id, {
            status: 'done',
          });
          const findUserDone = await this.UserModel.findById(booking.client_id);
          const lawyerDone = await this.UserModel.findById(booking.lawyer_id);
          await this.mailService.sendMail(
            `${findUserDone?.email}`,
            `Please rate your consultation with lawyer ${lawyerDone?.name}`,
            'Thank you for using LawOh services.',
          );
        }
      }
    } catch (error: any) {
      console.error('Error sending client review request emails:', error);
    }
  }
}
