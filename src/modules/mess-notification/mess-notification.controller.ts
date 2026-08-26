import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { MessNotificationService } from './mess-notification.service';
import { AuthorizerDecorator, UserData } from 'libs/decorators';
import { AuthorizedMetadata } from 'libs/interfaces/auth/authorize.response';
import { ApiTags } from '@nestjs/swagger';
import { ResponseDto } from 'libs/interfaces';

@ApiTags('mess-notification')
@Controller('mess-notification')
export class MessNotificationController {
  constructor(
    private readonly messNotificationService: MessNotificationService,
  ) {}

  @Get()
  @AuthorizerDecorator({ secured: true })
  async getMyMessageNotifications(
    @UserData() user: AuthorizedMetadata,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<ResponseDto<any>> {
    return this.messNotificationService.getAllByUserId(
      user.userId,
      page,
      limit,
    );
  }

  @Get('/unread-count')
  @AuthorizerDecorator({ secured: true })
  async getUnreadCount(@UserData() user: AuthorizedMetadata): Promise<
    ResponseDto<{
      totalUnread: number;
      unreadConversationsCount: number;
      unreadList: any[];
      latestUnread: any;
    }>
  > {
    return this.messNotificationService.getUnreadCount(user.userId);
  }

  @Patch('/read/:conversationId')
  @AuthorizerDecorator({ secured: true })
  async markAsRead(
    @Param('conversationId') conversationId: string,
    @UserData() user: AuthorizedMetadata,
  ): Promise<ResponseDto<any>> {
    return this.messNotificationService.markAsReadByConversation(
      conversationId,
      user.userId,
    );
  }
}
