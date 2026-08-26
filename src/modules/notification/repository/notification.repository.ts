import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BaseRepository } from 'libs/repository';
import { Notification, NotificationModelName } from 'libs/schemas/notification';
import { Model, Types } from 'mongoose';

@Injectable()
export class NotificationRepository extends BaseRepository<Notification> {
  constructor(
    @InjectModel(NotificationModelName)
    private readonly notificationModel: Model<Notification>,
  ) {
    super(notificationModel);
  }
}
