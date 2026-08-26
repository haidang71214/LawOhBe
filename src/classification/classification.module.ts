import { Module } from '@nestjs/common';
import { ClassificationController } from './classification.controller';
import { ClassificationService } from './classification.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeLawyer, TypeLawyerSchema, User, UserSchema } from 'src/config/database.config';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema },
      { name: TypeLawyer.name, schema: TypeLawyerSchema }
    ]),

  ],
  controllers: [ClassificationController],
  providers: [ClassificationService],
})
export class ClassificationModule {}