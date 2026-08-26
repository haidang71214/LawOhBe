import { Server } from 'socket.io';
import { INestApplication } from '@nestjs/common';
import { ChatService } from 'src/message/message.service';

export function setupSocketIo(app: INestApplication, chatService: ChatService) {
  const server = app.getHttpServer();
  const io = new Server(server, { cors: { origin: '*' } });

  io.on('connection', socket => {
    socket.on('joinRoom', (roomId) => {
      socket.join(roomId);
    });

    socket.on('register',(clientId)=>{
      io.to('dashboard').emit('user-online', { clientId, isOnline: true });
    })

    socket.on('sendMessage', async ({ conversationId, senderId, content }) => {
      const message = await chatService.addMessage(conversationId, senderId, content);
      io.to(conversationId).emit('newMessage', message);
    });

    socket.on('join-dashboard', () => {
      socket.join("dashboard");
      socket.emit("dashboard-joined");
    })

    socket.on('join-video-room', (roomId, clientId, requestClientId) => {
      socket.join(roomId);
      const room = io.sockets.adapter.rooms.get(roomId);
      const numClients = room ? room.size : 0;

      if (numClients === 1) {
        io.to('dashboard').emit('room-update', { roomId, status: 'waiting', clients: [clientId, requestClientId] });
      } else if (numClients === 2) {
        io.to('dashboard').emit('room-update', { roomId, status: 'started', clients: [requestClientId, clientId] });
      }
    });

    socket.on('send-peer-id', ({ roomId, peerId, recipientId }) => {
      socket.to(roomId).emit('receive-peer-id', { peerId });
    });

    socket.on('reject-call', (roomId) => {
      io.to(roomId).emit('call-rejected', { message: 'Cuộc gọi đã bị hủy' });
      const room = io.sockets.adapter.rooms.get(roomId);
      if (room) {
        for (const socketId of room) {
          const socketInRoom = io.sockets.sockets.get(socketId);
          if (socketInRoom) {
            socketInRoom.leave(roomId);
          }
        }
      }
      io.to('dashboard').emit('room-update', { roomId, status: 'rejected', clients: [] });
    });

    socket.on('disconnect', () => {});
  });
  
}
