import { Module } from '@nestjs/common';
import { VideoService } from './video.service';
import { VideoController } from './video.controller';
import { ShareModule } from 'src/shared/cloudinary/sharedModule';
import { MongooseModule } from '@nestjs/mongoose';
import {
  CommentDestination,
  UserDestination,
  VideoDestination,
} from 'libs/schemas';
import { EmailModule } from 'src/shared/email/email.module';
import { VideoRepository } from './repository/video.repository';
import { VideoMapper } from './mapper/video.mapper';
import { NotificationModule } from '../notification/notification.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      UserDestination,
      VideoDestination,
      CommentDestination,
    ]),
    ShareModule,
    EmailModule,
    NotificationModule,
    UsersModule,
  ],
  controllers: [VideoController],
  providers: [VideoService, VideoRepository, VideoMapper],
  exports: [VideoService, VideoRepository, VideoMapper],
})
export class VideoModule {}
