import { Module } from "@nestjs/common";
import { CloudynaryConfig } from "./cloundinary.config";
import { CloudinaryProvider } from "./cloundinary.provider";

@Module({
   providers:[CloudynaryConfig,CloudinaryProvider], 
   exports:[CloudinaryProvider]
})
export class CloudinaryModule{}