import { IsNotEmpty, IsString } from 'class-validator';

export class CloudinaryConfiguration {
  @IsString()
  @IsNotEmpty()
  cloudinaryApiSecret?: string;
  @IsString()
  @IsNotEmpty()
  cloudinaryApiKey?: string;
  @IsString()
  @IsNotEmpty()
  cloudinaryName?: string;
  constructor(data?: Partial<CloudinaryConfiguration>) {
    this.cloudinaryApiSecret =
      data?.cloudinaryApiSecret || process.env['CLOUDINARY_API_SECRET'];
    this.cloudinaryApiKey =
      data?.cloudinaryApiKey || process.env['CLOUDINARY_API_KEY'];
    this.cloudinaryName =
      data?.cloudinaryName || process.env['CLOUDINARY_NAME'];
  }
}
