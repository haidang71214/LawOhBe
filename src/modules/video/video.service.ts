import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateVideoDto,
  AcceptRejectDto,
  ResponseDto,
  VideoItemResponseDto,
  VideoListResponseDataDto,
} from './dto';
import { Comment, CommentModelName, User, UserModelName } from 'libs/schemas';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AcceptRejectAction } from 'libs/constant';
import { EmailService } from 'src/shared/email/email.service';
import { PaginationQueryDto } from 'libs/dto/pagination.dto';
import { getDeletedFilter } from 'libs/utils/pagination.util';
import { RedisService, REDIS_TTL } from 'src/shared/redis';
import { VideoRepository } from './repository/video.repository';
import { VideoMapper } from './mapper/video.mapper';
import { NotificationService } from '../notification/notification.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);

  constructor(
    private readonly videoRepository: VideoRepository,
    private readonly videoMapper: VideoMapper,
    @InjectModel(CommentModelName) private CommentModel: Model<Comment>,
    @InjectModel(UserModelName) private UserModel: Model<User>,
    private readonly emailService: EmailService,
    private readonly redisService: RedisService,
    private readonly notificationService: NotificationService,
    private readonly userService: UsersService,
  ) {}

  async createVideo(
    createVideoDto: CreateVideoDto,
    userId: string,
  ): Promise<ResponseDto<VideoItemResponseDto>> {
    console.log('[VideoService.createVideo] DTO received:', createVideoDto);
    const { categories, video_url, description, thubnail_url } = createVideoDto;
    const resolvedDescription =
      description?.trim() ||
      (createVideoDto as any)?.title?.trim() ||
      (createVideoDto as any)?.name?.trim() ||
      '';
    console.log(
      '[VideoService.createVideo] Resolved description:',
      resolvedDescription,
    );

    const data = await this.videoRepository.create({
      user_id: userId,
      star: 0,
      description: resolvedDescription,
      video_url,
      thumnail_url: thubnail_url,
      categories,
      accept: false,
    });

    try {
      const adminUser = await this.UserModel.findOne({ role: 'admin' });
      if (adminUser) {
        const notifContent = resolvedDescription
          ? `A new video was uploaded: "${resolvedDescription.slice(0, 60)}"`
          : `A new video was uploaded${categories ? ` in category: ${Array.isArray(categories) ? categories.join(', ') : categories}` : ''}.`;

        await this.notificationService.createNotification({
          recipient_id: adminUser._id.toString(),
          sender_id: userId,
          title: 'New Video Pending Approval',
          content: `${notifContent}`,
          type: 'SYSTEM',
          metadata: {
            reference_id: (data as any)?._id?.toString(),
            target_url: '/admin',
          },
        });

        if (adminUser.email) {
          const lawyer = await this.UserModel.findById(userId);
          const lawyerName = lawyer?.name || lawyer?.email || 'A Lawyer';
          const categoryLabel = Array.isArray(categories)
            ? categories.join(', ')
            : categories || 'N/A';
          await this.emailService.sendMail(
            adminUser.email,
            '[LawOh] New Video Needs Review',
            `Hi Admin,\n\nLawyer "${lawyerName}" just uploaded a new video that needs your review.\n\n- Topic / Description: "${resolvedDescription || 'N/A'}"\n- Category: ${categoryLabel}\n\nReview it at: http://localhost:3002/admin\n\nThanks!`,
          );
        }
      }
    } catch (err: any) {
      this.logger.error(
        `Error notifying admin for new video: ${err?.message || err}`,
      );
    }

    // Invalidate cache
    await this.redisService.delByPattern('cache:videos:*');

    return ResponseDto.success(
      this.videoMapper.toResponseDto(data),
      'Video created successfully',
      HttpStatus.CREATED,
    );
  }

  async getPublicVideos(
    filterObj: any,
  ): Promise<ResponseDto<VideoListResponseDataDto>> {
    const cacheKey = `cache:videos:public:${JSON.stringify(filterObj || {})}`;
    const cached =
      await this.redisService.get<VideoListResponseDataDto>(cacheKey);
    if (cached) {
      return ResponseDto.success(
        cached,
        'Videos retrieved successfully (cached)',
        HttpStatus.OK,
      );
    }

    const { page = 1, limit = 10, type, status_deleted } = filterObj;
    const whereCondition: any = {
      accept: true,
      ...getDeletedFilter(status_deleted),
    };
    if (type) {
      whereCondition.categories = type;
    }
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.max(1, parseInt(limit, 10) || 10);

    const { data, total } = await this.videoRepository.findWithPagination(
      whereCondition,
      pageNumber,
      limitNumber,
      { createdAt: -1 },
      {
        path: 'user_id',
        select: 'name avartar_url rate',
      },
    );

    const resultData = this.videoMapper.toListResponseDto(
      data,
      total,
      pageNumber,
      limitNumber,
    );

    await this.redisService.set(cacheKey, resultData, REDIS_TTL.FIVE_MINUTES);

    return ResponseDto.success(
      resultData,
      'Videos retrieved successfully',
      HttpStatus.OK,
    );
  }

  async getVideoById(id: string): Promise<ResponseDto<any>> {
    const cacheKey = `cache:videos:detail:${id}`;
    const cached = await this.redisService.get<any>(cacheKey);
    if (cached) {
      return ResponseDto.success(
        cached,
        'Video details retrieved successfully (cached)',
        HttpStatus.OK,
      );
    }

    const data = await this.videoRepository.findById(id, {
      path: 'user_id',
      select: 'name avartar_url rate',
    });
    if (!data) {
      throw new NotFoundException('Video not found');
    }
    const comment = await this.CommentModel.find({
      video_id: id,
    }).populate({
      path: 'user_id',
      select: 'name',
    });

    const result = {
      video: data,
      comment,
    };
    await this.redisService.set(
      cacheKey,
      result,
      REDIS_TTL.TEN_MINUTES || REDIS_TTL.FIFTEEN_MINUTES,
    );

    return ResponseDto.success(
      result,
      'Video details retrieved successfully',
      HttpStatus.OK,
    );
  }

  async moderateVideo(
    body: AcceptRejectDto,
    userId: string,
    id: string,
  ): Promise<ResponseDto<null>> {
    const { reason, action } = body;

    const video = await this.videoRepository.findById(id);
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    if (action === AcceptRejectAction.REJECT && reason) {
      if (video.user_id) {
        try {
          await this.notificationService.createNotification({
            recipient_id: video.user_id.toString(),
            sender_id: userId,
            title: 'Video Upload Rejected',
            content: `Your video "${video.description?.slice(0, 50) || ''}" was rejected. Reason: ${reason}`,
            type: 'SYSTEM',
            metadata: {
              reference_id: id,
              target_url: '/updateLawyerDetails',
            },
          });
        } catch (notifErr: any) {
          this.logger.error(
            `Failed to send video reject notification: ${notifErr?.message || notifErr}`,
          );
        }

        const author = await this.UserModel.findById(video.user_id);
        if (author?.email) {
          await this.emailService.sendMail(
            author.email,
            'Video Upload Rejected',
            `Your video upload has been rejected for the following reason:\n\n${reason}`,
          );
        }

        await this.videoRepository.findByIdAndUpdate(id, {
          isDeleted: true,
          deletedAt: new Date(),
        });
      }

      await this.redisService.delByPattern('cache:videos:*');
      return ResponseDto.success(
        null,
        'Video rejected and removed successfully',
        HttpStatus.OK,
      );
    } else if (action === AcceptRejectAction.ACCEPT && reason) {
      if (video.user_id) {
        try {
          await this.notificationService.createNotification({
            recipient_id: video.user_id.toString(),
            sender_id: userId,
            title: 'Video Upload Approved',
            content: `Your video "${video.description?.slice(0, 50) || ''}" has been approved and published.`,
            type: 'SYSTEM',
            metadata: {
              reference_id: id,
              target_url: '/updateLawyerDetails',
            },
          });
        } catch (notifErr: any) {
          this.logger.error(
            `Failed to send video approve notification: ${notifErr?.message || notifErr}`,
          );
        }
        const author = await this.UserModel.findById(video.user_id);
        if (author?.email) {
          await this.emailService.sendMail(
            author.email,
            'Video Upload Approved',
            `Your video upload has been approved.\n\nNote: ${reason}`,
          );
        }

        await this.videoRepository.findByIdAndUpdate(id, { accept: true });
      }

      await this.redisService.delByPattern('cache:videos:*');
      return ResponseDto.success(
        null,
        'Video approved successfully',
        HttpStatus.OK,
      );
    }

    throw new BadRequestException(
      'Required fields are missing for video approval/rejection',
    );
  }

  async getAdminVideos(
    userId: string,
    status?: string,
    queryDto?: PaginationQueryDto,
  ): Promise<ResponseDto<VideoListResponseDataDto>> {
    const page = Math.max(1, Number(queryDto?.page) || 1);
    const limit = Math.max(1, Number(queryDto?.limit) || 10);

    const query: any = {
      ...getDeletedFilter(queryDto?.status_deleted),
    };
    if (status && status !== 'all') {
      const statusValue = status.toLowerCase() === 'true';
      query.accept = statusValue;
    }

    const { data: videos, total } =
      await this.videoRepository.findWithPagination(query, page, limit, {
        createdAt: -1,
      });

    return ResponseDto.success(
      this.videoMapper.toListResponseDto(videos, total, page, limit),
      'Admin videos retrieved successfully',
      HttpStatus.OK,
    );
  }

  async getMyVideos(
    userId: string,
    queryDto?: PaginationQueryDto,
  ): Promise<ResponseDto<VideoListResponseDataDto>> {
    const page = Math.max(1, Number(queryDto?.page) || 1);
    const limit = Math.max(1, Number(queryDto?.limit) || 10);

    const filter = {
      user_id: userId,
      ...getDeletedFilter(queryDto?.status_deleted),
    };

    const { data: videos, total } =
      await this.videoRepository.findWithPagination(filter, page, limit, {
        createdAt: -1,
      });

    return ResponseDto.success(
      this.videoMapper.toListResponseDto(videos, total, page, limit),
      'My videos retrieved successfully',
      HttpStatus.OK,
    );
  }

  async removeVideo(id: string, userId: string): Promise<ResponseDto<null>> {
    const video = await this.videoRepository.findById(id);
    if (!video) {
      throw new NotFoundException('Video not found to delete');
    }

    const deleted = await this.videoRepository.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true },
    );
    if (!deleted) {
      throw new NotFoundException('Video not found to delete');
    }

    try {
      const currentUser = await this.UserModel.findById(userId);
      const isAdmin = currentUser?.role === 'admin';

      if (!isAdmin) {
        const adminUser = await this.UserModel.findOne({ role: 'admin' });
        if (adminUser) {
          await this.notificationService.createNotification({
            recipient_id: adminUser._id.toString(),
            sender_id: userId,
            title: 'Video Deleted by Author',
            content: `Lawyer "${currentUser?.name || currentUser?.email || 'User'}" deleted video: "${video.description?.slice(0, 50) || ''}". Please refresh the page.`,
            type: 'SYSTEM',
            metadata: {
              reference_id: id,
              target_url: '/admin',
            },
          });

          if (adminUser.email) {
            await this.emailService.sendMail(
              adminUser.email,
              '[LawOh] Video Deleted by Author',
              `Hi Admin,\n\nLawyer "${currentUser?.name || currentUser?.email || 'User'}" has deleted their video: "${video.description}".\n\nPlease reload your admin dashboard to update the records.\n\nThanks!`,
            );
          }
        }
      } else {
        if (video.user_id) {
          const author = await this.UserModel.findById(video.user_id);
          await this.notificationService.createNotification({
            recipient_id: video.user_id.toString(),
            sender_id: userId,
            title: 'Video Removed by Admin',
            content: `Your video "${video.description?.slice(0, 50) || ''}" was removed by an administrator. Please refresh your manager page.`,
            type: 'SYSTEM',
            metadata: {
              reference_id: id,
              target_url: '/updateLawyerDetails',
            },
          });

          if (author?.email) {
            await this.emailService.sendMail(
              author.email,
              '[LawOh] Video Removed by Administrator',
              `Hello,\n\nYour video titled "${video.description}" has been removed by an administrator.\n\nPlease reload your page to update your video list.\n\nThanks,\nLawOh Team`,
            );
          }
        }
      }
    } catch (err: any) {
      this.logger.error(
        `Error sending notification/email on video delete: ${err?.message || err}`,
      );
    }

    await this.redisService.delByPattern('cache:videos:*');

    return ResponseDto.success(
      null,
      'Video deleted successfully',
      HttpStatus.OK,
    );
  }
}
