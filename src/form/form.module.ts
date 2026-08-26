import { Module } from '@nestjs/common';
import { FormService } from './form.service';
import { FormController } from './form.controller';
import { Form, FormSchema } from 'src/config/database.config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import { TokenControllerService } from 'utils/token.utils';
import { ShareModule } from 'src/shared/sharedModule';
import { EmailModule } from 'src/email/email.module';
import { KeyModule } from 'src/key/key.module';
import { JwtModule } from '@nestjs/jwt';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  imports:[MongooseModule.forFeature([{
    name: Form.name,
    schema: FormSchema
  }]),
  AuthModule,JwtModule.register({}),KeyModule,EmailModule,ShareModule,TokenControllerService,StorageModule
  ],
  controllers: [FormController],
  providers: [FormService],
})
export class FormModule {}
