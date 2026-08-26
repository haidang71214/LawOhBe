import { Module } from '@nestjs/common';
import { VipPackageService } from './vip-package.service';
import { VipPackageController } from './vip-package.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema, VipPackage, VipPackageSchema } from 'src/config/database.config';
import { AuthModule } from 'src/auth/auth.module';
import { TokenControllerService } from 'utils/token.utils';
import { ShareModule } from 'src/shared/sharedModule';
import { EmailModule } from 'src/email/email.module';
import { KeyModule } from 'src/key/key.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports:[
    MongooseModule.forFeature([{name:VipPackage.name,schema:VipPackageSchema}]),
    MongooseModule.forFeature([{name:User.name,schema:UserSchema}]),
      JwtModule.register({}),KeyModule,EmailModule,ShareModule,TokenControllerService,AuthModule
  ],
  controllers: [VipPackageController],
  providers: [VipPackageService],
})
export class VipPackageModule {}
