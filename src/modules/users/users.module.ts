import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  BookingDestination,
  CustomPriceDestination,
  ReviewDestination,
  TypeLawyerDestination,
  SubTypeLawyerDestination,
  UserDestination,
} from 'libs/schemas';
import { ShareModule } from 'src/shared/cloudinary/sharedModule';
import { EmailModule } from 'src/shared/email/email.module';
import { UsersRepository } from './repository/users.repository';
import { UsersMapper } from './mapper/users.mapper';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      UserDestination,
      BookingDestination,
      ReviewDestination,
      TypeLawyerDestination,
      SubTypeLawyerDestination,
      CustomPriceDestination,
    ]),
    NotificationModule,
    ShareModule,
    EmailModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, UsersMapper],
  exports: [UsersService, UsersRepository, UsersMapper],
})
export class UsersModule {}
