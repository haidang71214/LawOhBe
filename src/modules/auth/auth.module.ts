import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { KeyModule } from 'src/shared/key/key.module';
import { JwtModule } from '@nestjs/jwt';
import { EmailModule } from 'src/shared/email/email.module';
import { ShareModule } from 'src/shared/cloudinary/sharedModule';
import { TokenModule } from 'utils/token.module';
import { UsersModule } from '../users/users.module';
import { AuthMapper } from './mapper/auth.mapper';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({ global: true }),
    KeyModule,
    EmailModule,
    ShareModule,
    TokenModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthMapper],
  exports: [AuthService, JwtModule, KeyModule, AuthMapper],
})
export class AuthModule {}
