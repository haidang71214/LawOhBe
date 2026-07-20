import { Module } from '@nestjs/common';
import { CloudUploadService } from './cloudUpload.service';

@Module({
  providers: [CloudUploadService],
  exports: [CloudUploadService],
})
export class ShareModule {}
