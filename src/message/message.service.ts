import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, Message } from 'src/config/database.config';


@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Conversation.name) private conversationModel: Model<Conversation>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {}

  async createConversation(participants: string[]): Promise<Conversation> {
    // Check nếu cuộc hội thoại đã tồn tại giữa 2 người (1-1 chat)
    const existing = await this.conversationModel.findOne({
      participants: { $all: participants, $size: participants.length },
      isGroup: false,
    });
    if (existing) return existing;

    const conversation = new this.conversationModel({ participants });
    return conversation.save();
  }

  // lấy hội thoại của cái user đó
  async getConversationsForUser(userId: string): Promise<Conversation[]> {
    return this.conversationModel.find({ participants: userId }).populate('participants');
  }

  async addMessage(conversationId: string, senderId: string, content: string): Promise<Message> {
    const message = new this.messageModel({
      conversation: conversationId,
      sender: senderId, // đây
      content,
      readBy: [senderId],
    });
    return message.save();
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return this.messageModel.find({ conversation: conversationId }).sort({ createdAt: 1 }).populate('sender');
  };


  async checkCoddddddnversation(clientId: String, lawyerId: String) {
    try {
      console.log(clientId,lawyerId);
      
      const conversation = await this.conversationModel
        .findOne({
          participants: [clientId, lawyerId]
        })
        .populate('participants')
        .exec();

      return conversation; // Trả về conversation nếu tồn tại, hoặc null nếu không
    } catch (error) {
      throw new NotFoundException(`Không tìm thấy cuộc hội thoại giữa ${clientId} và ${lawyerId}`);
    }
}
}
