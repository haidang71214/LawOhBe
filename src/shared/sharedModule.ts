import { Module } from "@nestjs/common";

import { CloudUploadService } from "./cloudUpload.service";
import { CloudinaryModule } from "src/cloundinary/cloundinary.module";

@Module({
   imports:[CloudinaryModule],
   providers:[CloudUploadService],
   exports:[CloudUploadService]
})
export class ShareModule{}