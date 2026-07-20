import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudUploadService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name:
        this.configService.get<string>('CLOUDINARY.cloudinaryName') ||
        this.configService.get<string>('CLOUDINARY_NAME') ||
        this.configService.get<string>('COUDINARY_NAME') ||
        process.env.CLOUDINARY_NAME ||
        process.env.COUDINARY_NAME,
      api_key:
        this.configService.get<string>('CLOUDINARY.cloudinaryApiKey') ||
        this.configService.get<string>('CLOUDINARY_API_KEY') ||
        this.configService.get<string>('COUDINARY_API_KEY') ||
        process.env.CLOUDINARY_API_KEY ||
        process.env.COUDINARY_API_KEY,
      api_secret:
        this.configService.get<string>('CLOUDINARY.cloudinaryApiSecret') ||
        this.configService.get<string>('CLOUDINARY_API_SECRET') ||
        process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder },
        (error: any, result: UploadApiResponse) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        },
      );
      uploadStream.end(file.buffer);
    });
  }

  async deleteImage(publicId: string): Promise<any> {
    try {
      publicId = publicId.replace(/%20/g, ' ');
      const result = await cloudinary.api.delete_resources([publicId], {
        resource_type: 'image',
      });
      if (result.deleted[publicId] === 'not_found') {
        throw new Error(`Image with public ID "${publicId}" not found.`);
      }
      return result;
    } catch (error: any) {
      throw new Error(`Error deleting image from Cloudinary: ${error.message}`);
    }
  }

  async uploadVideo(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'video',
        },
        (error: any, result: UploadApiResponse) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        },
      );
      uploadStream.end(file.buffer);
    });
  }

  async deleteVideo(publicId: string): Promise<any> {
    try {
      publicId = publicId.replace(/%20/g, ' ');
      const result = await cloudinary.api.delete_resources([publicId], {
        resource_type: 'video',
      });
      if (result.deleted[publicId] === 'not_found') {
        throw new Error(`Video with public ID "${publicId}" not found.`);
      }
      return result;
    } catch (error: any) {
      throw new Error(`Error deleting video from Cloudinary: ${error.message}`);
    }
  }

  async deleteMultipleImages(publicIds: string[]): Promise<any[]> {
    try {
      const sanitizedIds = publicIds.map((id) => id.replace(/%20/g, ' '));
      const result = await cloudinary.api.delete_resources(sanitizedIds, {
        resource_type: 'image',
      });

      const deletionResults = sanitizedIds.map((id) => {
        if (result.deleted[id] === 'not_found') {
          return { id, status: 'not_found' };
        }
        return { id, status: 'deleted' };
      });

      return deletionResults;
    } catch (error: any) {
      throw new Error(
        `Error deleting multiple images from Cloudinary: ${error.message}`,
      );
    }
  }

  async uploadMultipleImages(
    files: Express.Multer.File[],
    folder: string,
  ): Promise<UploadApiResponse[]> {
    try {
      const uploadPromises = files.map((file) =>
        this.uploadImage(file, folder),
      );
      const uploadResults = await Promise.all(uploadPromises);
      return uploadResults;
    } catch (error: any) {
      throw new Error(
        `Error uploading multiple images to Cloudinary: ${error.message}`,
      );
    }
  }
}
