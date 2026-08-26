import { Controller, Get, Patch, Delete, Param, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AuthorizerDecorator, UserData } from 'libs/decorators';
import { AuthorizedMetadata } from 'libs/interfaces/auth/authorize.response';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ResponseDto } from 'libs/interfaces';

@ApiTags('notification')
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @AuthorizerDecorator({ secured: true })
  @ApiOperation({ summary: 'Lấy danh sách thông báo của người dùng hiện tại' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Số trang (mặc định 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng phần tử mỗi trang (mặc định 10)',
  })
  @ApiQuery({
    name: 'is_read',
    required: false,
    type: Boolean,
    description: 'Lọc theo trạng thái đã đọc',
  })
  async getMyNotifications(
    @UserData() user: AuthorizedMetadata,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('is_read') isRead?: boolean,
  ): Promise<ResponseDto<any>> {
    let parsedIsRead: boolean | undefined = undefined;
    if (isRead !== undefined && isRead !== null) {
      parsedIsRead = String(isRead) === 'true';
    }
    return this.notificationService.getAllByUserId(
      user.userId,
      page,
      limit,
      parsedIsRead,
    );
  }

  @Get('/unread-count')
  @AuthorizerDecorator({ secured: true })
  @ApiOperation({
    summary: 'Lấy số lượng thông báo chưa đọc của người dùng hiện tại',
  })
  async getUnreadCount(
    @UserData() user: AuthorizedMetadata,
  ): Promise<ResponseDto<{ unreadCount: number }>> {
    return this.notificationService.getUnreadCount(user.userId);
  }

  @Patch('/read-all')
  @AuthorizerDecorator({ secured: true })
  @ApiOperation({
    summary: 'Đánh dấu tất cả thông báo của người dùng là đã đọc',
  })
  async markAllAsRead(
    @UserData() user: AuthorizedMetadata,
  ): Promise<ResponseDto<{ modifiedCount: number }>> {
    return this.notificationService.markAllAsRead(user.userId);
  }

  @Patch('/read/:id')
  @AuthorizerDecorator({ secured: true })
  @ApiOperation({ summary: 'Đánh dấu một thông báo là đã đọc' })
  async markAsRead(
    @Param('id') id: string,
    @UserData() user: AuthorizedMetadata,
  ): Promise<ResponseDto<any>> {
    return this.notificationService.markAsRead(id, user.userId);
  }

  @Patch('/:id/read')
  @AuthorizerDecorator({ secured: true })
  @ApiOperation({ summary: 'Đánh dấu một thông báo là đã đọc (alias)' })
  async markAsReadAlias(
    @Param('id') id: string,
    @UserData() user: AuthorizedMetadata,
  ): Promise<ResponseDto<any>> {
    return this.notificationService.markAsRead(id, user.userId);
  }

  @Delete('/clear-all')
  @AuthorizerDecorator({ secured: true })
  @ApiOperation({ summary: 'Xóa toàn bộ thông báo của người dùng' })
  async clearAllNotifications(
    @UserData() user: AuthorizedMetadata,
  ): Promise<ResponseDto<{ deletedCount: number }>> {
    return this.notificationService.deleteAllNotifications(user.userId);
  }

  @Delete('/all')
  @AuthorizerDecorator({ secured: true })
  @ApiOperation({ summary: 'Xóa toàn bộ thông báo của người dùng (alias)' })
  async clearAllNotificationsAlias(
    @UserData() user: AuthorizedMetadata,
  ): Promise<ResponseDto<{ deletedCount: number }>> {
    return this.notificationService.deleteAllNotifications(user.userId);
  }

  @Delete('/:id')
  @AuthorizerDecorator({ secured: true })
  @ApiOperation({ summary: 'Xóa một thông báo theo ID' })
  async deleteNotification(
    @Param('id') id: string,
    @UserData() user: AuthorizedMetadata,
  ): Promise<ResponseDto<any>> {
    return this.notificationService.deleteNotification(id, user.userId);
  }
}
