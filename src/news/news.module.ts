import { Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { New, NewSchema, User, UserSchema } from 'src/config/database.config';
import { AuthModule } from 'src/auth/auth.module';
import { TokenControllerService } from 'utils/token.utils';
import { ShareModule } from 'src/shared/sharedModule';
import { EmailModule } from 'src/email/email.module';
import { KeyModule } from 'src/key/key.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports:[MongooseModule.forFeature([
    {name:New.name,schema:NewSchema},
    {name:User.name,schema:UserSchema}
  ]),JwtModule.register({}),KeyModule,EmailModule,ShareModule,TokenControllerService,AuthModule ],
  controllers: [NewsController],
  providers: [NewsService],
})
export class NewsModule {}
