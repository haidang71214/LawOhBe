import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User, UserSchema} from 'src/config/database.config';
import { MongooseModule } from '@nestjs/mongoose';
import { KeyModule } from 'src/key/key.module';
import { JwtModule } from '@nestjs/jwt';
import { EmailModule } from 'src/email/email.module';
import { ShareModule } from 'src/shared/sharedModule';
import { TokenHeheModule } from 'utils/token.module';

@Module({
  imports:[
     MongooseModule.forFeature([{ name: User.name, schema: UserSchema },]), 
     JwtModule.register({}), KeyModule,EmailModule,ShareModule,TokenHeheModule
      ],
  controllers: [AuthController],
  providers: [AuthService],
  exports:[AuthService]
})
export class AuthModule {}
