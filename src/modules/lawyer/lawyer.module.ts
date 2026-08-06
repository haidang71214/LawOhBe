import { Module } from '@nestjs/common';
import { LawyerService } from './lawyer.service';
import { LawyerController } from './lawyer.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  BookingDestination,
  CustomPriceDestination,
  MarketPriceRangeDestination,
  ReviewDestination,
  SubTypeLawyerDestination,
  TypeLawyerDestination,
  UserDestination,
} from 'libs/schemas';
import { TypeLawyerRepository } from './repository/type-lawyer.repository';
import { SubTypeLawyerRepository } from './repository/sub-type-lawyer.repository';
import { CustomPriceRepository } from './repository/custom-price.repository';
import { LawyerMapper } from './mapper/lawyer.mapper';
import { UsersModule } from '../users/users.module';
import { ShareModule } from 'src/shared/cloudinary/sharedModule';

@Module({
  imports: [
    MongooseModule.forFeature([
      UserDestination,
      ReviewDestination,
      TypeLawyerDestination,
      SubTypeLawyerDestination,
      BookingDestination,
      MarketPriceRangeDestination,
      CustomPriceDestination,
    ]),
    UsersModule,
    ShareModule,
  ],
  controllers: [LawyerController],
  providers: [
    LawyerService,
    TypeLawyerRepository,
    SubTypeLawyerRepository,
    CustomPriceRepository,
    LawyerMapper,
  ],
  exports: [
    LawyerService,
    TypeLawyerRepository,
    SubTypeLawyerRepository,
    CustomPriceRepository,
    LawyerMapper,
  ],
})
export class LawyerModule {}
