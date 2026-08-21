import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  transports: ['polling', 'websocket'],
})
export class MessageGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(MessageGateway.name);

  // Lưu trữ số lượng tab/socket đang hoạt động của mỗi user: Map<userId, tab_count>
  private readonly userSocketsCount = new Map<string, number>();

  @WebSocketServer()
  server: Server;

  handleConnection(socket: Socket) {
    const userId =
      socket.handshake.auth?.userId || socket.handshake.query?.userId;
    this.logger.log(
      `[Socket Connect] Client connected: socketId=${socket.id}, userId=${userId || 'anonymous'}`,
    );

    if (userId && userId !== 'undefined' && userId !== 'null') {
      this.addOnlineUser(userId, socket);
    }
  }

  handleDisconnect(socket: Socket) {
    this.logger.log(
      `[Socket Disconnect] Client disconnected: socketId=${socket.id}`,
    );
    this.removeOnlineUser(socket);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(
      `[Event: joinRoom] socketId=${socket.id}, payload roomId=${JSON.stringify(roomId)}`,
    );
    if (roomId) {
      socket.join(roomId);
      this.logger.log(
        `[Socket Room] socketId=${socket.id} joined room=${roomId}`,
      );
    }
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(
      `[Event: leaveRoom] socketId=${socket.id}, payload roomId=${JSON.stringify(roomId)}`,
    );
    if (roomId) {
      socket.leave(roomId);
      this.logger.log(
        `[Socket Room] socketId=${socket.id} left room=${roomId}`,
      );
    }
  }

  // User đăng nhập / kết nối room cá nhân
  @SubscribeMessage('userLogin')
  handleUserLogin(
    @MessageBody() data: string | { userId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId =
      typeof data === 'object' && data?.userId
        ? data.userId
        : typeof data === 'string'
          ? data
          : '';
    if (userId && userId !== 'undefined' && userId !== 'null') {
      this.addOnlineUser(userId, socket);
    }
  }

  // Kiểm tra 1 user cụ thể có đang online hay không
  @SubscribeMessage('checkUserOnline')
  handleCheckUserOnline(
    @MessageBody() targetUserId: string,
    @ConnectedSocket() socket: Socket,
  ) {
    const isOnline = this.userSocketsCount.has(targetUserId);
    socket.emit('userOnlineStatus', { userId: targetUserId, isOnline });
  }

  // Lấy danh sách toàn bộ ID đang online
  @SubscribeMessage('getOnlineUsers')
  handleGetOnlineUsers(@ConnectedSocket() socket: Socket) {
    socket.emit('onlineUsersList', Array.from(this.userSocketsCount.keys()));
  }

  @SubscribeMessage('typing')
  handleUserTyping(
    @MessageBody()
    data: { userId: string; conversastionId?: string; conversationId?: string },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(
      `[Event: typing] socketId=${socket.id}, payload=${JSON.stringify(data)}`,
    );
    const roomId = data?.conversationId || data?.conversastionId;
    if (roomId) {
      socket.to(roomId).emit('userTyping', data.userId);
      this.logger.log(
        `[Broadcast typing] Emitted userTyping (userId: ${data?.userId}) to room=${roomId}`,
      );
    } else {
      this.logger.warn(
        `[Event: typing] Missing roomId in payload from socketId=${socket.id}`,
      );
    }
  }

  @SubscribeMessage('stopTyping')
  handleUserStopTyping(
    @MessageBody()
    data: { userId: string; conversastionId?: string; conversationId?: string },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(
      `[Event: stopTyping] socketId=${socket.id}, payload=${JSON.stringify(data)}`,
    );
    const roomId = data?.conversationId || data?.conversastionId;
    if (roomId) {
      socket.to(roomId).emit('userStopTyping', data.userId);
      this.logger.log(
        `[Broadcast stopTyping] Emitted userStopTyping (userId: ${data?.userId}) to room=${roomId}`,
      );
    } else {
      this.logger.warn(
        `[Event: stopTyping] Missing roomId in payload from socketId=${socket.id}`,
      );
    }
  }

  // --- Helper Methods xử lý Online / Offline ---
  private addOnlineUser(userId: string, socket: Socket) {
    socket.join(`${userId}`);
    const prevUserId = socket.data?.userId;

    // Tránh tăng count nhiều lần trên cùng 1 socket nếu FE emit userLogin lặp lại
    if (prevUserId === userId) return;

    socket.data.userId = userId;
    const currentCount = this.userSocketsCount.get(userId) || 0;
    this.userSocketsCount.set(userId, currentCount + 1);

    this.logger.log(
      `[User Online] userId=${userId}, activeTabs=${currentCount + 1}`,
    );

    // Nếu vừa mở tab đầu tiên -> Phát sự kiện Online cho tất cả người khác
    if (currentCount === 0) {
      socket.broadcast.emit('userOnline', userId);
    }
  }

  private removeOnlineUser(socket: Socket) {
    const userId = socket.data?.userId;
    if (!userId) return;

    const currentCount = (this.userSocketsCount.get(userId) || 1) - 1;

    if (currentCount <= 0) {
      this.userSocketsCount.delete(userId);
      this.logger.log(`[User Offline] userId=${userId} has closed all tabs`);
      // Bắn sự kiện Offline cho tất cả client
      this.server.emit('userOffline', userId);
    } else {
      this.userSocketsCount.set(userId, currentCount);
      this.logger.log(
        `[User Tab Closed] userId=${userId}, remainingTabs=${currentCount}`,
      );
    }
  }
}
