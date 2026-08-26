import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { TokenHeheControllerService } from './token.utils';

@Module({
  imports:[
     JwtModule.register({})  ],
  providers: [TokenHeheControllerService],
  exports:[TokenHeheControllerService]
  
})
export class TokenHeheModule {}
