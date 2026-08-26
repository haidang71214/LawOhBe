import { Module } from '@nestjs/common';
import { PriceRangeService } from './price-range.service';
import { PriceRangeController } from './price-range.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomPrice, CustomPriceSchema, MarketPriceRange, MarketPriceRangeSchema, User, UserSchema } from 'src/config/database.config';
import { JwtModule } from '@nestjs/jwt';
import { KeyModule } from 'src/key/key.module';
import { EmailModule } from 'src/email/email.module';
import { ShareModule } from 'src/shared/sharedModule';
import { TokenControllerService } from 'utils/token.utils';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports:[
    MongooseModule.forFeature([
      {name:User.name,schema:UserSchema},
      {name:MarketPriceRange.name,schema:MarketPriceRangeSchema},
      {name:CustomPrice.name,schema:CustomPriceSchema}
    ]),
    JwtModule.register({}),KeyModule,EmailModule,ShareModule,TokenControllerService,AuthModule
  ],
  controllers: [PriceRangeController],
  providers: [PriceRangeService],
})
export class PriceRangeModule {}
