import { Module } from '@nestjs/common';
import { StringGeesetupController } from './string-geesetup.controller';
import { JwtModule } from '@nestjs/jwt';
import { KeyModule } from 'src/key/key.module';
import { EmailModule } from 'src/email/email.module';
import { ShareModule } from 'src/shared/sharedModule';
import { TokenControllerService } from 'utils/token.utils';
import { AuthModule } from 'src/auth/auth.module';
import { StringGeesetupService } from './string-geesetup.service';

@Module({
  imports:[JwtModule.register({}),KeyModule,EmailModule,ShareModule,TokenControllerService,AuthModule],
  controllers: [StringGeesetupController],
  providers: [StringGeesetupService],
  
})
export class StringGeesetupModule {}
