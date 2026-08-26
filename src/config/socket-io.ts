import { Server } from 'socket.io';
import { INestApplication } from '@nestjs/common';
import { ChatService } from 'src/message/message.service';
import { CommentService } from 'src/comment/comment.service';
// lấy cái chat service vô mà xử lí

export function setupSocketIo(app: INestApplication, chatService: ChatService,commentService :CommentService) {
  const server = app.getHttpServer();
  const io = new Server(server, { cors: { origin: '*' } });

  io.on('connection', socket => {
    console.log('Client connected:', socket.id);

    socket.on('joinRoom', (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on('sendMessage', async ({ conversationId, senderId, content }) => {
      const message = await chatService.addMessage(conversationId, senderId, content);
      io.to(conversationId).emit('newMessage', message);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  // mỗi lần join 1 video là join 1 cái room với id chính là cái video đó
  // mỗi lần out là disconnent
  // on là send comment
  socket.on('joinVideo',(video_id)=>{
    socket.join(video_id) // join 1 cái video_id mới
    console.log("");
    
  })
  socket.on('sendComment', async ({ videoId, senderId, content, parent_comment_id }) => {
    try {
      const createCommentDto = {
        content,
        parent_comment_id
      };
  
      const comment = await commentService.create(
        createCommentDto,
        senderId,   // userId
        videoId     // videoId là id truyền vô model
      );
  
      io.to(videoId).emit('newComment', comment); // gửi lại comment cho client cùng room
    } catch (error) {
      console.error('Error creating comment:', error);
      socket.emit('errorComment', { message: 'Comment failed!' });
    }
  });
  
  });
  // làm thêm 1 cái comment
  // mỗi lần block vô 
}
