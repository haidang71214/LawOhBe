import { applyDecorators, SetMetadata } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { MetadataKeys } from "libs/constant";

export const AuthorizerDecorator = ({secure = false}:{secure:boolean}) =>{
   const setMetadata = SetMetadata(MetadataKeys.SECURED,{
      secure
   });
   if(secure){
      const decorator = [ApiBearerAuth()];
      return applyDecorators(...decorator,setMetadata);
   }
   return setMetadata;
}