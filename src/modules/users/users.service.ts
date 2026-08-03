import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateUserDto,
  UpdateUserDto,
  RequestLawyerRoleDto,
  ResponseDto,
  UserItemResponseDto,
  UserListResponseDataDto,
} from './dto';
import {
  Booking,
  BookingModelName,
  CustomPrice,
  CustomPriceModelName,
  ETypeLawyer,
  Review,
  ReviewModelName,
  TypeLawyer,
  TypeLawyerModelName,
  SubTypeLawyer,
  SubTypeLawyerModelName,
} from 'libs/schemas';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { PaginationQueryDto } from 'libs/dto/pagination.dto';
import { getDeletedFilter } from 'libs/utils/pagination.util';
import { RedisService, REDIS_TTL } from 'src/shared/redis';
import { EmailService } from 'src/shared/email/email.service';
import { CloudUploadService } from 'src/shared/cloudinary/cloudUpload.service';
import { UsersRepository } from './repository/users.repository';
import { UsersMapper } from './mapper/users.mapper';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly usersMapper: UsersMapper,
    @InjectModel(BookingModelName) private BookingModel: Model<Booking>,
    @InjectModel(ReviewModelName) private ReviewModel: Model<Review>,
    @InjectModel(TypeLawyerModelName)
    private TypeLawyerModel: Model<TypeLawyer>,
    @InjectModel(SubTypeLawyerModelName)
    private SubTypeLawyerModel: Model<SubTypeLawyer>,
    @InjectModel(CustomPriceModelName)
    private CustomPriceModel: Model<CustomPrice>,
    private readonly cloudUploadService: CloudUploadService,
    private readonly emailService: EmailService,
    private readonly redisService: RedisService,
    private readonly notificationService: NotificationService,
  ) {}

  async createUser(
    createUserDto: CreateUserDto,
  ): Promise<ResponseDto<UserItemResponseDto>> {
    const checkEmail = await this.usersRepository.findByEmail(
      createUserDto.email,
    );
    if (checkEmail) {
      throw new BadRequestException('Email already in use');
    }
    const checkPhone = await this.usersRepository.findByPhone(
      createUserDto.phone,
    );
    if (checkPhone) {
      throw new BadRequestException('Phone number already in use');
    }
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const results = await this.usersRepository.create({
      password: hashedPassword,
      email: createUserDto.email,
      phone: createUserDto.phone,
      name: createUserDto.name,
      avartar_url: createUserDto.avartar_url,
      age: createUserDto.age,
      role: createUserDto.role,
      province: createUserDto.province,
      warn: createUserDto.warn,
      isEmailVerified: true,
    });

    // Invalidate cache
    await this.redisService.delByPattern('cache:users:*');

    return ResponseDto.success(
      this.usersMapper.toResponseDto(results),
      'User created successfully',
      HttpStatus.CREATED,
    );
  }

  async findAllUsers(
    userId: string,
    queryDto?: PaginationQueryDto,
  ): Promise<ResponseDto<UserListResponseDataDto>> {
    const cacheKey = `cache:users:list:${JSON.stringify(queryDto || {})}`;
    const cached =
      await this.redisService.get<UserListResponseDataDto>(cacheKey);
    if (cached) {
      return ResponseDto.success(
        cached,
        'Users retrieved successfully (cached)',
        HttpStatus.OK,
      );
    }

    const page = Math.max(1, Number(queryDto?.page) || 1);
    const limit = Math.max(1, Number(queryDto?.limit) || 10);
    const filter = getDeletedFilter(queryDto?.status_deleted);

    const { data: users, total } =
      await this.usersRepository.findWithPagination(filter, page, limit, {
        createdAt: -1,
      });

    const resultData = this.usersMapper.toListResponseDto(
      users,
      total,
      page,
      limit,
    );

    await this.redisService.set(cacheKey, resultData, REDIS_TTL.FIVE_MINUTES);

    return ResponseDto.success(
      resultData,
      'Users retrieved successfully',
      HttpStatus.OK,
    );
  }

  async getUserById(id: string): Promise<ResponseDto<any>> {
    const cacheKey = `cache:users:detail:${id}`;
    const cached = await this.redisService.get<any>(cacheKey);
    if (cached) {
      return ResponseDto.success(
        cached,
        'User details retrieved successfully (cached)',
        HttpStatus.OK,
      );
    }

    const responseUser = await this.usersRepository.findById(id);
    if (!responseUser) {
      throw new NotFoundException('User not found');
    }

    const sanitizedUser =
      typeof (responseUser as any).toObject === 'function'
        ? (responseUser as any).toObject()
        : { ...responseUser };
    delete sanitizedUser.password;
    delete sanitizedUser.access_token;
    delete sanitizedUser.refresh_token;

    let result: any = null;
    if (responseUser.role === 'user') {
      const [bookingUser, reviewUser] = await Promise.all([
        this.BookingModel.find({
          client_id: responseUser._id,
        }).populate({
          path: 'lawyer_id',
          select: '-password -access_token -refresh_token',
        }),
        this.ReviewModel.find({
          client_id: responseUser._id,
        }).populate({
          path: 'lawyer_id',
          select: '-password -access_token -refresh_token',
        }),
      ]);
      result = {
        user: sanitizedUser,
        bookingUser,
        reviewUser,
      };
    } else if (responseUser.role === 'lawyer') {
      const [bookingLawyer, reviewLawyer] = await Promise.all([
        this.BookingModel.find({
          lawyer_id: responseUser._id,
        }).populate({
          path: 'client_id',
          select: '-password -access_token -refresh_token',
        }),
        this.ReviewModel.find({
          lawyer_id: responseUser._id,
        }).populate({
          path: 'client_id',
          select: '-password -access_token -refresh_token',
        }),
      ]);
      result = {
        user: sanitizedUser,
        bookingLawyer,
        reviewLawyer,
      };
    } else {
      result = {
        user: sanitizedUser,
      };
    }

    await this.redisService.set(cacheKey, result, REDIS_TTL.FIVE_MINUTES);

    return ResponseDto.success(
      result,
      'User details retrieved successfully',
      HttpStatus.OK,
    );
  }

  async changeUserRole(
    id: string,
    newRole: string,
    userId: string,
  ): Promise<ResponseDto<UserItemResponseDto>> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const previousRole = user.role;
    user.role = newRole as any;

    if (newRole === 'lawyer' && !user.typeLawyer) {
      const typeLawyer = await this.TypeLawyerModel.create({
        type: ETypeLawyer.CIVIL,
        lawyer_id: user._id,
      });
      user.typeLawyer = typeLawyer._id as any;

      await this.CustomPriceModel.updateOne(
        { lawyer_id: user._id, type: ETypeLawyer.CIVIL },
        {
          lawyer_id: user._id,
          type: ETypeLawyer.CIVIL,
          price: 100000,
          description: 'Default consultation',
        },
        { upsert: true },
      );
    } else if (previousRole === 'lawyer' && newRole !== 'lawyer') {
      // Xử lý khi hạ quyền / khóa tư cách luật sư:
      // Tìm các lịch hẹn đang chờ hoặc đã thanh toán chưa diễn ra
      const activeBookings = await this.BookingModel.find({
        lawyer_id: user._id,
        status: { $in: ['pending', 'accept', 'paid'] },
      }).populate('client_id');

      if (activeBookings.length > 0) {
        await Promise.all(
          activeBookings.map(async (booking) => {
            booking.status = 'cancelled';
            booking.note = `${
              booking.note ? booking.note + ' | ' : ''
            }Lịch hẹn đã tự động hủy do tư cách Luật sư bị thay đổi/hạ quyền. Quý khách vui lòng đặt lịch luật sư khác hoặc liên hệ CSKH để được hỗ trợ hoàn tiền.`;
            await booking.save();

            const client = booking.client_id as any;
            if (client && client.email) {
              const clientName = client.name || 'Quý khách';
              const lawyerName = user.name || 'Luật sư';
              const bookingTime = booking.booking_start
                ? new Date(booking.booking_start).toLocaleString('vi-VN')
                : 'thời gian đã hẹn';

              await this.emailService
                .sendMail(
                  client.email,
                  'Thông báo hủy lịch hẹn tư vấn - LawOh',
                  `Kính gửi ${clientName},\n\nLịch hẹn tư vấn của bạn (Mã: ${booking._id}) với ${lawyerName} vào lúc ${bookingTime} đã được hệ thống hủy do Luật sư không còn phụ trách tiếp nhận tư vấn.\n\nNếu bạn đã thanh toán, hệ thống sẽ tiến hành hỗ trợ hoàn tiền hoặc bạn có thể chủ động chọn và đặt lại lịch với một Luật sư khác trên nền tảng LawOh.\n\nXin chân thành cảm ơn,\nĐội ngũ LawOh.`,
                )
                .catch((err) =>
                  console.error(
                    `Failed to send cancellation email: ${err.message}`,
                  ),
                );
            }
          }),
        );
      }
    }

    await (user as any).save();

    // Invalidate cache
    await this.redisService.delByPattern('cache:users:*');
    await this.redisService.delByPattern('cache:lawyers:*');
    await this.redisService.delByPattern('cache:bookings:*');

    return ResponseDto.success(
      this.usersMapper.toResponseDto(user),
      'Role changed successfully',
      HttpStatus.OK,
    );
  }

  async updateUserByAdmin(
    id: string,
    updateUserDto: UpdateUserDto,
    userId: string,
  ): Promise<ResponseDto<null>> {
    const { password, phone, name, avartar_url, role, province } =
      updateUserDto;

    const currentUser = await this.usersRepository.findById(id);
    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    const updateData: any = {};

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    if (phone !== undefined && phone !== null) updateData.phone = phone;
    if (name !== undefined && name !== null) updateData.name = name;
    if (avartar_url !== undefined && avartar_url !== null)
      updateData.avartar_url = avartar_url;
    if (role !== undefined && role !== null) updateData.role = role;
    if (province !== undefined && province !== null)
      updateData.province = province;

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No fields provided to update');
    }

    if (role && currentUser.role === 'lawyer' && role !== 'lawyer') {
      const activeBookings = await this.BookingModel.find({
        lawyer_id: currentUser._id,
        status: { $in: ['pending', 'accept', 'paid'] },
      }).populate('client_id');

      if (activeBookings.length > 0) {
        await Promise.all(
          activeBookings.map(async (booking) => {
            booking.status = 'cancelled';
            booking.note = `${
              booking.note ? booking.note + ' | ' : ''
            }Lịch hẹn đã tự động hủy do tư cách Luật sư bị thay đổi/hạ quyền. Quý khách vui lòng đặt lịch luật sư khác hoặc liên hệ CSKH để được hỗ trợ hoàn tiền.`;
            await booking.save();

            const client = booking.client_id as any;
            if (client && client.email) {
              const clientName = client.name || 'Quý khách';
              const lawyerName = currentUser.name || 'Luật sư';
              const bookingTime = booking.booking_start
                ? new Date(booking.booking_start).toLocaleString('vi-VN')
                : 'thời gian đã hẹn';

              await this.emailService
                .sendMail(
                  client.email,
                  'Thông báo hủy lịch hẹn tư vấn - LawOh',
                  `Kính gửi ${clientName},\n\nLịch hẹn tư vấn của bạn (Mã: ${booking._id}) với ${lawyerName} vào lúc ${bookingTime} đã được hệ thống hủy do Luật sư không còn phụ trách tiếp nhận tư vấn.\n\nNếu bạn đã thanh toán, hệ thống sẽ tiến hành hỗ trợ hoàn tiền hoặc bạn có thể chủ động chọn và đặt lại lịch với một Luật sư khác trên nền tảng LawOh.\n\nXin chân thành cảm ơn,\nĐội ngũ LawOh.`,
                )
                .catch((err) =>
                  console.error(
                    `Failed to send cancellation email: ${err.message}`,
                  ),
                );
            }
          }),
        );
      }
    }

    await this.usersRepository.findByIdAndUpdate(id, updateData);

    // Invalidate cache
    await this.redisService.delByPattern('cache:users:*');
    await this.redisService.delByPattern('cache:lawyers:*');
    await this.redisService.delByPattern('cache:bookings:*');

    return ResponseDto.success(
      null,
      'User updated successfully',
      HttpStatus.OK,
    );
  }

  async updateUserProfile(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<ResponseDto<null>> {
    const { name, phone, age, password, avartar_url, province } = updateUserDto;

    const updateFields: any = {};

    if (name) updateFields.name = name;
    if (phone) updateFields.phone = phone;
    if (age) updateFields.age = age;
    if (avartar_url) updateFields.avartar_url = avartar_url;
    if (province) updateFields.province = province;

    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.password = hashedPassword;
    }
    const updatedUser = await this.usersRepository.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true },
    );

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    // Invalidate cache
    await this.redisService.delByPattern('cache:users:*');
    await this.redisService.delByPattern('cache:lawyers:*');

    return ResponseDto.success(
      null,
      'Profile updated successfully',
      HttpStatus.OK,
    );
  }

  async getUserBookings(userId: string): Promise<ResponseDto<any[]>> {
    const bookings = await this.BookingModel.find({ client_id: userId });
    return ResponseDto.success(
      bookings,
      'User bookings retrieved successfully',
      HttpStatus.OK,
    );
  }

  // 1. User gửi yêu cầu xin cấp quyền làm Luật sư
  async requestLawyerRole(
    userId: string,
    dto: RequestLawyerRoleDto,
    files?: Array<Express.Multer.File>,
  ): Promise<ResponseDto<UserItemResponseDto>> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'lawyer') {
      throw new BadRequestException(
        'Account is already a lawyer. No need to request again.',
      );
    }

    // Parse array if sent via multipart/form-data
    let type_lawyer = dto.type_lawyer;
    if (typeof (type_lawyer as any) === 'string') {
      try {
        type_lawyer = JSON.parse(type_lawyer as any);
      } catch {
        type_lawyer = (type_lawyer as any as string).split(',') as any;
      }
    }
    if (
      !type_lawyer ||
      !Array.isArray(type_lawyer) ||
      type_lawyer.length === 0
    ) {
      type_lawyer = [ETypeLawyer.CIVIL];
    }

    let sub_type_lawyers = dto.sub_type_lawyers;
    if (typeof (sub_type_lawyers as any) === 'string') {
      try {
        sub_type_lawyers = JSON.parse(sub_type_lawyers as any);
      } catch {
        sub_type_lawyers = (sub_type_lawyers as any as string).split(',');
      }
    }
    if (!Array.isArray(sub_type_lawyers)) {
      sub_type_lawyers = sub_type_lawyers ? [sub_type_lawyers] : [];
    }

    let certificate = dto.certificate;
    if (typeof (certificate as any) === 'string') {
      try {
        certificate = JSON.parse(certificate as any);
      } catch {
        certificate = [certificate as any];
      }
    }
    if (!Array.isArray(certificate)) {
      certificate = certificate ? [certificate] : user.certificate || [];
    }

    if (files && files.length > 0) {
      const uploadResults = await this.cloudUploadService.uploadMultipleImages(
        files,
        'certificates',
      );
      const uploadedUrls = uploadResults.map((r) => r.secure_url);
      certificate = [...certificate, ...uploadedUrls];
    }

    user.description = dto.description;
    user.experienceYear = dto.experienceYear;
    user.certificate = certificate;
    user.pending_type_lawyer = type_lawyer as any;
    user.pending_sub_type_lawyers = sub_type_lawyers;
    user.lawyer_request_status = 'pending';
    user.lawyer_request_reason = '';

    await (user as any).save();

    // Invalidate cache
    await this.redisService.delByPattern('cache:users:*');

    // Gửi thông báo đến Admin
    try {
      const adminUsers = await this.usersRepository.find({ role: 'admin' });
      for (const admin of adminUsers) {
        await this.notificationService.createNotification({
          recipient_id: admin._id.toString(),
          sender_id: user._id.toString(),
          title: 'Yêu cầu duyệt hồ sơ Luật sư mới',
          content: `Người dùng ${user.name || user.email} vừa nộp hồ sơ xin cấp quyền Luật sư.`,
          type: 'LAWYER_APPROVAL',
          metadata: {
            reference_id: user._id.toString(),
            target_url: '/admin/lawyer-requests',
          },
        });
      }
    } catch (notiErr) {
      console.error(
        'Error sending lawyer request notification to admin:',
        notiErr,
      );
    }

    return ResponseDto.success(
      this.usersMapper.toResponseDto(user),
      'Lawyer role request submitted successfully. Please wait for admin approval.',
      HttpStatus.OK,
    );
  }

  // 2. Admin lấy danh sách các yêu cầu xin cấp quyền
  async getLawyerRequests(
    queryDto?: PaginationQueryDto,
  ): Promise<ResponseDto<UserListResponseDataDto>> {
    const page = Math.max(1, Number(queryDto?.page) || 1);
    const limit = Math.max(1, Number(queryDto?.limit) || 10);

    const filter = {
      lawyer_request_status: 'pending',
      ...getDeletedFilter(queryDto?.status_deleted),
    };

    const { data: users, total } =
      await this.usersRepository.findWithPagination(filter, page, limit, {
        updatedAt: -1,
      });

    const resultData = this.usersMapper.toListResponseDto(
      users,
      total,
      page,
      limit,
    );

    return ResponseDto.success(
      resultData,
      'Pending lawyer requests retrieved successfully',
      HttpStatus.OK,
    );
  }

  // 3. Admin chấp thuận yêu cầu cấp quyền Luật sư
  async acceptLawyerRequest(
    id: string,
    adminId: string,
  ): Promise<ResponseDto<UserItemResponseDto>> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.lawyer_request_status !== 'pending') {
      throw new BadRequestException(
        `Cannot accept request with status '${user.lawyer_request_status}'`,
      );
    }

    user.role = 'lawyer';
    user.lawyer_request_status = 'accepted';
    user.lawyer_request_reason = '';

    const types =
      user.pending_type_lawyer && user.pending_type_lawyer.length > 0
        ? (user.pending_type_lawyer as ETypeLawyer[])
        : [ETypeLawyer.CIVIL];

    if (!user.typeLawyer) {
      const newTypeLawyer = await this.TypeLawyerModel.create({
        type: types,
        lawyer_id: user._id,
      });
      user.typeLawyer = newTypeLawyer._id as any;

      if (
        user.pending_sub_type_lawyers &&
        user.pending_sub_type_lawyers.length > 0
      ) {
        await Promise.all(
          user.pending_sub_type_lawyers.map(async (name) => {
            await this.SubTypeLawyerModel.create({
              name,
              parentType: newTypeLawyer._id,
            });
          }),
        );
      }
    } else {
      await this.TypeLawyerModel.findByIdAndUpdate(user.typeLawyer, {
        type: types,
      });

      if (
        user.pending_sub_type_lawyers &&
        user.pending_sub_type_lawyers.length > 0
      ) {
        await Promise.all(
          user.pending_sub_type_lawyers.map(async (name) => {
            await this.SubTypeLawyerModel.create({
              name,
              parentType: user.typeLawyer,
            });
          }),
        );
      }
    }

    // Khởi tạo mức giá mặc định cho các chuyên ngành
    const customTypes =
      user.pending_sub_type_lawyers && user.pending_sub_type_lawyers.length > 0
        ? user.pending_sub_type_lawyers
        : types;

    await Promise.all(
      customTypes.map(async (type) => {
        await this.CustomPriceModel.findOneAndUpdate(
          { lawyer_id: user._id, type },
          {
            lawyer_id: user._id,
            type,
            price: 100000,
            description: 'Default consultation price',
          },
          { upsert: true },
        );
      }),
    );

    await (user as any).save();

    // Gửi email chúc mừng phê duyệt thành công
    if (user.email) {
      const clientName = user.name || 'Quý khách';
      const emailSubject =
        '🎉 Chúc mừng! Hồ sơ xin cấp quyền Luật sư đã được phê duyệt - LawOh';
      const emailText = `Kính gửi ${clientName},\n\nChúc mừng bạn! Yêu cầu cấp quyền trở thành Luật sư của bạn trên nền tảng LawOh đã được Ban quản trị phê duyệt thành công.\n\nHồ sơ luật sư, thông tin kinh nghiệm và bằng cấp chứng chỉ của bạn đã được kích hoạt trực tiếp trên hệ thống. Bạn đã có thể bắt đầu nhận lịch hẹn tư vấn và thiết lập bảng giá của mình.\n\nTrân trọng,\nBan quản trị LawOh.`;

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #4338ca; margin: 0;">LawOh Platform</h2>
            <p style="color: #6b7280; font-size: 13px; margin-top: 4px;">Nền tảng Tư vấn Pháp lý Trực tuyến</p>
          </div>
          <div style="padding: 20px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #166534; margin: 0 0 10px 0;">🎉 Hồ sơ Luật sư đã được phê duyệt!</h3>
            <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0;">
              Kính gửi <strong>${clientName}</strong>,<br/>
              Ban quản trị <strong>LawOh</strong> xin chúc mừng bạn! Yêu cầu cấp quyền trở thành Luật sư của bạn đã được xét duyệt thành công.
            </p>
          </div>
          <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
            Tài khoản của bạn đã được chuyển sang vai trò <strong>Luật sư</strong>. Hồ sơ, số năm kinh nghiệm và chứng chỉ của bạn đã sẵn sàng hiển thị trên danh bạ luật sư để tiếp nhận khách hàng đặt lịch tư vấn.
          </p>
          <div style="margin: 28px 0; text-align: center;">
            <a href="https://lawoh.com/update-profile" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
              Xem & Cập nhật Hồ sơ Luật sư
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
            Email này được gửi tự động từ hệ thống LawOh. Vui lòng không trả lời trực tiếp email này.
          </p>
        </div>
      `;

      await this.emailService
        .sendMail(user.email, emailSubject, emailText, emailHtml)
        .catch((err) =>
          console.error(`Failed to send acceptance email: ${err.message}`),
        );
    }

    // Gửi thông báo realtime cho Luật sư
    try {
      await this.notificationService.createNotification({
        recipient_id: user._id.toString(),
        sender_id: adminId,
        title: '🎉 Hồ sơ Luật sư đã được phê duyệt',
        content:
          'Chúc mừng! Yêu cầu cấp quyền Luật sư của bạn đã được Ban quản trị phê duyệt thành công.',
        type: 'LAWYER_APPROVED',
        metadata: {
          reference_id: user._id.toString(),
          target_url: '/lawyers',
          link: '/lawyers',
        },
      });
    } catch (notiErr) {
      console.error('Error sending accept lawyer notification:', notiErr);
    }

    // Invalidate cache
    await this.redisService.delByPattern('cache:users:*');
    await this.redisService.delByPattern('cache:lawyers:*');

    return ResponseDto.success(
      this.usersMapper.toResponseDto(user),
      'Lawyer request accepted successfully. User has been promoted to lawyer.',
      HttpStatus.OK,
    );
  }

  // 4. Admin từ chối yêu cầu cấp quyền Luật sư
  async rejectLawyerRequest(
    id: string,
    reason: string,
    adminId: string,
  ): Promise<ResponseDto<UserItemResponseDto>> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.lawyer_request_status !== 'pending') {
      throw new BadRequestException(
        `Cannot reject request with status '${user.lawyer_request_status}'`,
      );
    }

    user.lawyer_request_status = 'rejected';
    user.lawyer_request_reason = reason;

    await (user as any).save();

    // Gửi email thông báo từ chối kèm lý do chi tiết
    if (user.email) {
      const clientName = user.name || 'Quý khách';
      const emailSubject = '⚠️ Thông báo về yêu cầu cấp quyền Luật sư - LawOh';
      const emailText = `Kính gửi ${clientName},\n\nCảm ơn bạn đã quan tâm và gửi hồ sơ xin cấp quyền Luật sư trên nền tảng LawOh.\n\nSau khi xem xét, Ban quản trị rất tiếc thông báo yêu cầu của bạn chưa được phê duyệt vào thời điểm này.\nLý do từ chối: ${reason}\n\nBạn có thể cập nhật lại thông tin hồ sơ/chứng chỉ và gửi lại yêu cầu bất kỳ lúc nào trên hệ thống.\n\nTrân trọng,\nBan quản trị LawOh.`;

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #4338ca; margin: 0;">LawOh Platform</h2>
            <p style="color: #6b7280; font-size: 13px; margin-top: 4px;">Nền tảng Tư vấn Pháp lý Trực tuyến</p>
          </div>
          <div style="padding: 20px; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #991b1b; margin: 0 0 10px 0;">Thông báo chưa phê duyệt hồ sơ Luật sư</h3>
            <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0;">
              Kính gửi <strong>${clientName}</strong>,<br/>
              Cảm ơn bạn đã nộp hồ sơ xin cấp quyền Luật sư trên hệ thống <strong>LawOh</strong>. Sau khi đối chiếu hồ sơ và chứng chỉ, Ban quản trị rất tiếc chưa thể phê duyệt yêu cầu của bạn vào lúc này.
            </p>
          </div>
          
          <div style="padding: 16px; background-color: #f9fafb; border-left: 4px solid #ef4444; border-radius: 4px; margin-bottom: 20px;">
            <strong style="color: #1f2937; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Lý do từ chối từ Ban Quản Trị:</strong>
            <p style="color: #dc2626; font-size: 14px; margin: 8px 0 0 0; line-height: 1.5; font-style: italic;">
              "${reason}"
            </p>
          </div>

          <p style="color: #4b5563; font-size: 13px; line-height: 1.6;">
            💡 <strong>Gợi ý:</strong> Bạn có thể kiểm tra lại tính hợp lệ của thẻ luật sư/chứng chỉ hành nghề, bổ sung thông tin mô tả chi tiết hơn và nhấn <strong>Nộp lại hồ sơ</strong> trong trang Hồ sơ cá nhân bất kỳ lúc nào.
          </p>

          <div style="margin: 28px 0; text-align: center;">
            <a href="https://lawoh.com/update-profile" style="background-color: #ef4444; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
              Cập nhật & Nộp lại Hồ sơ
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
            Email này được gửi tự động từ hệ thống LawOh. Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ bộ phận hỗ trợ khách hàng.
          </p>
        </div>
      `;

      await this.emailService
        .sendMail(user.email, emailSubject, emailText, emailHtml)
        .catch((err) =>
          console.error(`Failed to send rejection email: ${err.message}`),
        );
    }

    // Gửi thông báo realtime cho User khi bị từ chối
    try {
      await this.notificationService.createNotification({
        recipient_id: user._id.toString(),
        sender_id: adminId,
        title: '⚠️ Thông báo hồ sơ Luật sư chưa được duyệt',
        content: `Yêu cầu cấp quyền Luật sư của bạn chưa được phê duyệt. Lý do: ${reason}`,
        type: 'LAWYER_REJECTED',
        metadata: {
          reference_id: user._id.toString(),
          target_url: '/updateLawyerDetails',
          link: '/updateLawyerDetails',
        },
      });
    } catch (notiErr) {
      console.error('Error sending reject lawyer notification:', notiErr);
    }

    // Invalidate cache
    await this.redisService.delByPattern('cache:users:*');

    return ResponseDto.success(
      this.usersMapper.toResponseDto(user),
      'Lawyer request rejected successfully',
      HttpStatus.OK,
    );
  }
  async adminIdGetter(): Promise<string> {
    const response = await this.usersRepository.findOne({ role: 'admin' });
    if (!response || !response._id) {
      throw new NotFoundException('Admin user not found');
    }
    return response._id.toString();
  }
}
