import {v2 as cloudinary} from 'cloudinary';
import  {ConfigService} from '@nestjs/config'; 
import   {Injectable} from '@nestjs/common';
@Injectable()
// setup
export class CloudynaryConfig{
   constructor(private readonly configServicce : ConfigService ){
      cloudinary.config({
         cloud_name:this.configServicce.get<string>("COUDINARY_NAME"),
         api_key:this.configServicce.get<string>("COUDINARY_API_KEY"),
         api_secret:this.configServicce.get<string>("CLOUDINARY_API_SECRET")
      })
   }

}