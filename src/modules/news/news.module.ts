import { Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { NewDestination, UserDestination } from 'libs/schemas';
import { ShareModule } from 'src/shared/cloudinary/sharedModule';
import { NewsRepository } from './repository/news.repository';
import { NewsMapper } from './mapper/news.mapper';
import { NotificationModule } from '../notification/notification.module';
import { EmailModule } from 'src/shared/email/email.module';

@Module({
  imports: [
    MongooseModule.forFeature([NewDestination, UserDestination]),
    NotificationModule,
    EmailModule,
    ShareModule,
  ],
  controllers: [NewsController],
  providers: [NewsService, NewsRepository, NewsMapper],
  exports: [NewsService, NewsRepository, NewsMapper],
})
export class NewsModule {}
