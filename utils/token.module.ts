import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TokenControllerService } from './token.utils';


@Module({
  imports:[
     JwtModule.register({})  ],
  providers: [TokenControllerService],
  exports:[TokenControllerService]
  
})
export class TokenHeheModule {}
