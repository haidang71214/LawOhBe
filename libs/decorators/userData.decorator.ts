import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { MetadataKeys } from "libs/constant";
import { AuthorizedMetadata, AuthorizeResponse } from "libs/interfaces/auth/authorize.response";

export const UserData = createParamDecorator((data:unknown,ctx:ExecutionContext)=>{
   const request = ctx.switchToHttp().getRequest();
   const userData = request[MetadataKeys.USER_DATA] as AuthorizeResponse;
   if(!userData){
      throw new UnauthorizedException("User not found !!");
   }
   return new AuthorizedMetadata(userData?.metadata);
})