import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BaseRepository } from 'libs/repository';
import {
  MessageNotification,
  MessageNotificationModelName,
} from 'libs/schemas/messageNotification';
import { Model } from 'mongoose';

@Injectable()
export class MessNotificationRepository extends BaseRepository<MessageNotification> {
  constructor(
    @InjectModel(MessageNotificationModelName)
    private readonly messNotificationModel: Model<MessageNotification>,
  ) {
    super(messNotificationModel);
  }
}
