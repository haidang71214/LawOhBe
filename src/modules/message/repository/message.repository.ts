import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from 'libs/schemas';
import { BaseRepository } from 'libs/repository';

@Injectable()
export class MessageRepository extends BaseRepository<Message> {
  constructor(
    @InjectModel(Message.name)
    private readonly msgModel: Model<Message>,
  ) {
    super(msgModel);
  }

  async findByConversation(
    conversationId: string,
    page = 1,
    limit = 10,
  ): Promise<Message[]> {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 20);
    const skip = (pageNum - 1) * limitNum;

    // Query latest messages first (descending), apply skip/limit, then reverse for chat flow
    const messages = await this.msgModel
      .find({ conversation: conversationId })
      .populate('sender')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .exec();

    return messages.reverse();
  }
}
