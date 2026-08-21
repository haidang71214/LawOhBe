import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Conversation } from 'libs/schemas';
import { BaseRepository } from 'libs/repository';

@Injectable()
export class ConversationRepository extends BaseRepository<Conversation> {
  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<Conversation>,
  ) {
    super(conversationModel);
  }

  async findConversationByParticipants(
    participants: string[],
  ): Promise<Conversation | null> {
    return this.findOne({
      participants: { $all: participants, $size: participants.length },
    });
  }

  async findUserConversations(userId: string): Promise<Conversation[]> {
    return this.find({ participants: userId }, 'participants');
  }
}
