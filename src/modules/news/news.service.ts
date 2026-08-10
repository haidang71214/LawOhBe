import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateNewsDto,
  ResponseDto,
  NewsItemResponseDto,
  NewsListResponseDataDto,
  AcceptRejectNewsDto,
} from './dto';
import { PaginationQueryDto } from 'libs/dto/pagination.dto';
import { getDeletedFilter } from 'libs/utils/pagination.util';
import { RedisService, REDIS_KEYS, REDIS_TTL } from 'src/shared/redis';
import { NewsRepository } from './repository/news.repository';
import { NewsMapper } from './mapper/news.mapper';
import { Model, Types } from 'mongoose';
import { NotificationService } from '../notification/notification.service';
import { InjectModel } from '@nestjs/mongoose';
import { ENewsStatus, User, UserModelName } from 'libs/schemas';
import { AcceptRejectAction } from 'libs/constant';
import { EmailService } from 'src/shared/email/email.service';

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);

  constructor(
    private readonly newsRepository: NewsRepository,
    private readonly newsMapper: NewsMapper,
    private readonly redisService: RedisService,
    private readonly notificationService: NotificationService,
    private readonly emailService: EmailService,
    @InjectModel(UserModelName) private readonly userModel: Model<User>,
  ) {}

  async createNews(
    createNewsDto: CreateNewsDto,
    userId: string,
  ): Promise<ResponseDto<NewsItemResponseDto>> {
    const { content, image_urls, mainTitle, type } = createNewsDto;
    const response = await this.newsRepository.create({
      type,
      content,
      image_url: image_urls,
      userId: Types.ObjectId.isValid(userId)
        ? new Types.ObjectId(userId)
        : userId,
      mainTitle,
      status: ENewsStatus.PENDING,
      isAccept: false,
      rejectReason: '',
    });

    // Invalidate cache
    await this.redisService.delByPattern('cache:news:*');

    // Notify & Email all admin users
    try {
      const author = await this.userModel.findById(userId);
      const authorName = author?.name || author?.email || 'Luật sư';
      const adminUsers = await this.userModel.find({
        role: { $in: ['admin', 'ADMIN'] },
        $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
      });

      if (!adminUsers || adminUsers.length === 0) {
        this.logger.warn(
          '[createNews] No admin users found with role admin to send notification',
        );
      }

      for (const admin of adminUsers) {
        // 1. Socket & Database Notification
        await this.notificationService.createNotification({
          recipient_id: admin._id.toString(),
          sender_id: userId,
          title: 'New Article Pending Approval',
          content: `Lawyer ${authorName} submitted a new article: "${mainTitle || 'Untitled'}".`,
          type: 'NEWS_PENDING',
          metadata: {
            reference_id: (response as any)?._id?.toString(),
            target_url: '/admin',
          },
        });

        // 2. Email notification to Admin
        if (admin.email) {
          await this.emailService
            .sendMail(
              admin.email,
              `[LawOh] New News Article Needs Review: "${mainTitle || 'Untitled'}"`,
              `Hi Admin,\n\nLawyer "${authorName}" just submitted a new news article that needs your review.\n\n- Title: "${mainTitle || 'Untitled'}"\n- Category: ${type || 'General'}\n\nPlease review it at: http://localhost:3002/admin\n\nThanks!`,
            )
            .catch((mailErr: any) =>
              this.logger.error(
                `Failed to send email to admin ${admin.email}: ${mailErr?.message || mailErr}`,
              ),
            );
        }
      }
    } catch (notifErr: any) {
      this.logger.error(
        `Failed to notify admin on news creation: ${notifErr?.message || notifErr}`,
        notifErr?.stack,
      );
    }

    return ResponseDto.success(
      this.newsMapper.toResponseDto(response),
      'News created successfully',
      HttpStatus.CREATED,
    );
  }

  async getMyNews(
    userId: string,
    queryDto?: PaginationQueryDto,
  ): Promise<ResponseDto<NewsListResponseDataDto>> {
    const page = Math.max(1, Number(queryDto?.page) || 1);
    const limit = Math.max(1, Number(queryDto?.limit) || 10);

    const userFilter = Types.ObjectId.isValid(userId)
      ? { $in: [userId, new Types.ObjectId(userId)] }
      : userId;

    const filter: any = {
      userId: userFilter,
      ...getDeletedFilter(queryDto?.status_deleted),
    };

    const { data, total } = await this.newsRepository.findWithPagination(
      filter,
      page,
      limit,
      { createdAt: -1 },
    );

    return ResponseDto.success(
      this.newsMapper.toListResponseDto(data, total, page, limit),
      'My news list retrieved successfully',
      HttpStatus.OK,
    );
  }

  async getPublicNews(
    queryDto?: PaginationQueryDto,
  ): Promise<ResponseDto<NewsListResponseDataDto>> {
    const cacheKey = REDIS_KEYS.PUBLIC_NEWS(JSON.stringify(queryDto || {}));
    const cached =
      await this.redisService.get<NewsListResponseDataDto>(cacheKey);
    if (cached) {
      return ResponseDto.success(
        cached,
        'Public news retrieved successfully (cached)',
        HttpStatus.OK,
      );
    }

    const page = Math.max(1, Number(queryDto?.page) || 1);
    const limit = Math.max(1, Number(queryDto?.limit) || 10);

    const filter: any = {
      $or: [{ status: ENewsStatus.ACCEPT }, { isAccept: true }],
      ...getDeletedFilter(queryDto?.status_deleted),
    };

    const { data: response, total } =
      await this.newsRepository.findWithPagination(
        filter,
        page,
        limit,
        { createdAt: -1 },
        'userId',
      );

    const resultData = this.newsMapper.toListResponseDto(
      response,
      total,
      page,
      limit,
    );

    await this.redisService.set(cacheKey, resultData, REDIS_TTL.FIVE_MINUTES);

    return ResponseDto.success(
      resultData,
      'Public news retrieved successfully',
      HttpStatus.OK,
    );
  }

  async getAdminNews(
    status?: string,
    queryDto?: PaginationQueryDto,
  ): Promise<ResponseDto<NewsListResponseDataDto>> {
    const page = Math.max(1, Number(queryDto?.page) || 1);
    const limit = Math.max(1, Number(queryDto?.limit) || 10);

    const query: any = {
      ...getDeletedFilter(queryDto?.status_deleted),
    };

    if (status && status !== 'all') {
      if (status === 'true' || status === 'accept') {
        query.$or = [{ status: ENewsStatus.ACCEPT }, { isAccept: true }];
      } else if (status === 'false' || status === 'pending') {
        query.status = ENewsStatus.PENDING;
        query.isAccept = false;
      } else if (status === 'reject') {
        query.status = ENewsStatus.REJECT;
      } else {
        query.status = status;
      }
    }

    const { data: news, total } = await this.newsRepository.findWithPagination(
      query,
      page,
      limit,
      { createdAt: -1 },
      'userId',
    );

    return ResponseDto.success(
      this.newsMapper.toListResponseDto(news, total, page, limit),
      'Admin news retrieved successfully',
      HttpStatus.OK,
    );
  }

  async getNewsById(id: string): Promise<ResponseDto<NewsItemResponseDto>> {
    const cacheKey = `cache:news:detail:${id}`;
    const cached = await this.redisService.get<NewsItemResponseDto>(cacheKey);
    if (cached) {
      return ResponseDto.success(
        cached,
        'News details retrieved successfully (cached)',
        HttpStatus.OK,
      );
    }

    const response = await this.newsRepository.findById(id, 'userId');
    if (!response) {
      throw new NotFoundException('News not found');
    }

    const result = this.newsMapper.toResponseDto(response);
    await this.redisService.set(
      cacheKey,
      result,
      REDIS_TTL.TEN_MINUTES || REDIS_TTL.FIFTEEN_MINUTES,
    );

    return ResponseDto.success(
      result,
      'News details retrieved successfully',
      HttpStatus.OK,
    );
  }

  async approveNews(
    id: string,
    adminId?: string,
  ): Promise<ResponseDto<NewsItemResponseDto>> {
    const response = await this.newsRepository.findByIdAndUpdate(
      id,
      {
        status: ENewsStatus.ACCEPT,
        isAccept: true,
        rejectReason: '',
      },
      { new: true },
    );
    if (!response) {
      throw new NotFoundException('News not found to approve');
    }

    // Invalidate cache
    await this.redisService.delByPattern('cache:news:*');

    // Send notification and email to author
    if (response.userId) {
      const recipientId = (response.userId as any)?._id
        ? (response.userId as any)._id.toString()
        : response.userId.toString();

      try {
        await this.notificationService.createNotification({
          recipient_id: recipientId,
          sender_id: adminId,
          title: 'Article Approved',
          content: `Your article "${response.mainTitle || ''}" has been approved and published.- click link or reload page`,
          type: 'NEWS_APPROVED',
          metadata: {
            reference_id: response._id.toString(),
            target_url: `/news/${response._id.toString()}`,
          },
        });
      } catch (notifErr: any) {
        this.logger.error(
          `Failed to send news approval notification: ${notifErr?.message || notifErr}`,
        );
      }

      try {
        const author = await this.userModel.findById(recipientId);
        if (author?.email) {
          await this.emailService.sendMail(
            author.email,
            `[LawOh] Your News Article Has Been Approved: "${response.mainTitle || ''}"`,
            `Hi ${author.name || 'Author'},\n\nCongratulations! Your article "${response.mainTitle || ''}" has been approved and published on LawOh Gazette.\n\nView it at: http://localhost:3002/news/${response._id}\n\nThanks!`,
          );
        }
      } catch (mailErr: any) {
        this.logger.error(
          `Failed to send news approval email: ${mailErr?.message || mailErr}`,
        );
      }
    }

    return ResponseDto.success(
      this.newsMapper.toResponseDto(response),
      'News approved successfully',
      HttpStatus.OK,
    );
  }

  async rejectNews(
    id: string,
    adminId?: string,
    reason?: string,
  ): Promise<ResponseDto<NewsItemResponseDto>> {
    const news = await this.newsRepository.findById(id);
    if (!news) {
      throw new NotFoundException('News not found to reject');
    }

    // Reject does NOT soft delete! It updates status to 'reject' and keeps data for the author
    const updatedNews = await this.newsRepository.findByIdAndUpdate(
      id,
      {
        status: ENewsStatus.REJECT,
        isAccept: false,
        rejectReason: reason || '',
      },
      { new: true },
    );

    // Invalidate cache
    await this.redisService.delByPattern('cache:news:*');

    // Send notification and email to author
    if (news.userId) {
      const recipientId = (news.userId as any)?._id
        ? (news.userId as any)._id.toString()
        : news.userId.toString();

      try {
        await this.notificationService.createNotification({
          recipient_id: recipientId,
          sender_id: adminId,
          title: 'Article Rejected',
          content: `Your article "${news.mainTitle || ''}" was rejected.${reason ? ` Reason: ${reason}` : ''} `,
          type: 'NEWS_REJECTED',
          metadata: {
            reference_id: id,
            target_url: '/newsSelf',
          },
        });
      } catch (notifErr: any) {
        this.logger.error(
          `Failed to send news rejection notification: ${notifErr?.message || notifErr}`,
        );
      }

      try {
        const author = await this.userModel.findById(recipientId);
        if (author?.email) {
          await this.emailService.sendMail(
            author.email,
            `[LawOh] Your News Article Has Been Rejected: "${news.mainTitle || ''}"`,
            `Hi ${author.name || 'Author'},\n\nYour article "${news.mainTitle || ''}" was rejected by the administration team.\n\nReason / Feedback: ${reason || 'Does not meet editorial guidelines'}\n\nYou can review, update, or resubmit your article at: http://localhost:3002/newsSelf\n\nThanks!`,
          );
        }
      } catch (mailErr: any) {
        this.logger.error(
          `Failed to send news rejection email: ${mailErr?.message || mailErr}`,
        );
      }
    }

    return ResponseDto.success(
      this.newsMapper.toResponseDto(updatedNews || news),
      'News rejected successfully',
      HttpStatus.OK,
    );
  }

  async moderateNews(
    id: string,
    body: AcceptRejectNewsDto,
    adminId?: string,
  ): Promise<ResponseDto<any>> {
    const { action, reason } = body;
    if (action === AcceptRejectAction.ACCEPT) {
      return this.approveNews(id, adminId);
    } else if (action === AcceptRejectAction.REJECT) {
      return this.rejectNews(id, adminId, reason);
    }
    throw new BadRequestException('Invalid moderation action');
  }

  async removeNews(id: string, userId: string): Promise<ResponseDto<null>> {
    // Actual Soft Delete on remove/delete API
    const deleteNews = await this.newsRepository.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true },
    );
    if (!deleteNews) {
      throw new NotFoundException('News not found to delete');
    }

    // Invalidate cache
    await this.redisService.delByPattern('cache:news:*');

    return ResponseDto.success(
      null,
      'News deleted successfully',
      HttpStatus.OK,
    );
  }
}
