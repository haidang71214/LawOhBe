import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';
import { KeyModule } from 'src/key/key.module';
import {
  LearnPackage,
  LearnPackageSchema,
  User,
  UserSchema,
} from 'src/config/database.config';
import { LearnPackageController } from './learn-package.controller';
import { LearnPackageService } from './learn-package.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LearnPackage.name, schema: LearnPackageSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
    JwtModule.register({}),
    KeyModule,
  ],
  controllers: [LearnPackageController],
  providers: [LearnPackageService],
  exports: [LearnPackageService],
})
export class LearnPackageModule {}
