import { Module } from '@nestjs/common';
import { LearnPackageService } from './learn-package.service';
import { LearnPackageController } from './learn-package.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { LearnPackageDestination, UserDestination } from 'libs/schemas';
import { LearnPackageRepository } from './repository/learn-package.repository';
import { LearnPackageMapper } from './mapper/learn-package.mapper';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([LearnPackageDestination, UserDestination]),
    UsersModule,
  ],
  controllers: [LearnPackageController],
  providers: [LearnPackageService, LearnPackageRepository, LearnPackageMapper],
  exports: [LearnPackageService, LearnPackageRepository, LearnPackageMapper],
})
export class LearnPackageModule {}
