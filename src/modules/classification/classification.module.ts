import { Module } from '@nestjs/common';
import { ClassificationController } from './classification.controller';
import { ClassificationService } from './classification.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeLawyerDestination, UserDestination } from 'libs/schemas';
import { ClassificationMapper } from './mapper/classification.mapper';
import { UsersModule } from '../users/users.module';
import { LawyerModule } from '../lawyer/lawyer.module';

@Module({
  imports: [
    MongooseModule.forFeature([UserDestination, TypeLawyerDestination]),
    UsersModule,
    LawyerModule,
  ],
  controllers: [ClassificationController],
  providers: [ClassificationService, ClassificationMapper],
  exports: [ClassificationService, ClassificationMapper],
})
export class ClassificationModule {}
