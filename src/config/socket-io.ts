import { Server } from 'socket.io';
import { INestApplication } from '@nestjs/common';
import { ChatService } from 'src/message/message.service';
// lấy cái chat service vô mà xử lí

export function setupSocketIo(app: INestApplication, chatService: ChatService) {
  const server = app.getHttpServer();
  const io = new Server(server, { cors: { origin: '*' } });

  // chỉ connection 1 lần
  io.on('connection', socket => {
    console.log('Client connected:', socket.id);
    socket.on('joinRoom', (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });
    // check user online
    socket.on('register',(clientId)=>{
      // nó sẽ checkUser online và gửi tới dashboard
      io.to('dashboard').emit('user-online', { clientId, isOnline: true });
    })

    socket.on('sendMessage', async ({ conversationId, senderId, content }) => {
      const message = await chatService.addMessage(conversationId, senderId, content);
      io.to(conversationId).emit('newMessage', message);
    });
// join dasboard ni hắn sẽ hứng trên fe về để làm cái join 
    socket.on('join-dashboard', () => {
      socket.join("dashboard"); // room
      socket.emit("dashboard-joined");
    })

    socket.on('join-video-room', (roomId, clientId, requestClientId) => {
      socket.join(roomId);
      const room = io.sockets.adapter.rooms.get(roomId);
      const numClients = room ? room.size : 0;
      console.log('aaaaaaaaaaaasdasdasd ',roomId, clientId);
// lỗi ở chỗ này, nó numClient khi rejcet là là null hoặc 1, nhưng khi khởi tạo lại thì nó đang auto = 2 
      if (numClients === 1) {
        io.to('dashboard').emit('room-update', { roomId, status: 'waiting', clients: [clientId, requestClientId] });
      } else if (numClients === 2) {
// check lại trạng thái stated vì nó làm hư watting
        console.log('trường hợp đã update ');
        
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

    // disconected
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
  
}
