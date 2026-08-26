import { Module } from '@nestjs/common';
import { VideoService } from './video.service';
import { VideoController } from './video.controller';
import { ShareModule } from 'src/shared/sharedModule';
import { MongooseModule } from '@nestjs/mongoose';
import { Comment, CommentSchema, User, UserSchema, Videos, VideoSchema } from 'src/config/database.config';
import { JwtModule } from '@nestjs/jwt';
import { KeyModule } from 'src/key/key.module';
import { EmailModule } from 'src/email/email.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports:[
    MongooseModule.forFeature([
      {name:User.name,schema:UserSchema},
      {name:Videos.name,schema:VideoSchema},
      {name:Comment.name,schema:CommentSchema}
    ]),ShareModule,JwtModule.register({}),KeyModule,EmailModule,AuthModule
    ],

  controllers: [VideoController],
  providers: [VideoService],
})
export class VideoModule {}
