import { Controller, Post, Body, Get, Param, Req, UseGuards, Res } from '@nestjs/common';
import { ChatService } from './message.service';
import { CreateConversationDto } from './dto/update-message.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/stratergy/jwt.guard';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';


@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService   ) {}

// tạo cái cuộc hội thoại mới
// hoặc giữa luật sư với người user hoặc theo nhóm á
@Post('conversation')
async createConversation(@Body() createConversationDto: CreateConversationDto) {
  return this.chatService.createConversation(createConversationDto.participants);
}
// lấy hội thoại của cái user đó
  @Get('conversations/:userId')
  async getUserConversations(@Param('userId') userId: string) {
    return this.chatService.getConversationsForUser(userId);
  }
// api gửi tin nhắn
  @Post('message')
  async sendMessage(
    @Body('conversationId') conversationId: string,
    @Body('content') content: string,
    @Body('senderId') senderId: string,
  ) {
    return this.chatService.addMessage(conversationId, senderId, content);
  }
// api lấy đoạn hội thoại
  @Get('messages/:conversationId')
  async getMessages(@Param('conversationId') conversationId: string) {
    return this.chatService.getMessages(conversationId);
  }
 
  @Get('/checkConvedddrsation/:lawyerId')
 @UseGuards(JwtAuthGuard)
 @ApiBearerAuth()
  async checkConverSation(
    @Param('lawyerId') lawyerId:String,
    @Req() req,
    @Res() res:Response
  )
  {
    try {
      const {userId} = req.user
      console.log(userId,lawyerId);
      
      const data = await this.chatService.checkCoddddddnversation(userId,lawyerId)
      return res.status(200).json({data})
    } catch (error) {
      throw new Error(error)
    }
  }

}
