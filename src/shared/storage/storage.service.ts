import { Injectable, BadRequestException } from '@nestjs/common';
import { extname } from 'path';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class StorageService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name:
        this.configService.get<string>('CLOUDINARY_NAME') ||
        this.configService.get<string>('COUDINARY_NAME') ||
        process.env.CLOUDINARY_NAME ||
        process.env.COUDINARY_NAME,
      api_key:
        this.configService.get<string>('CLOUDINARY_API_KEY') ||
        this.configService.get<string>('COUDINARY_API_KEY') ||
        process.env.CLOUDINARY_API_KEY ||
        process.env.COUDINARY_API_KEY,
      api_secret:
        this.configService.get<string>('CLOUDINARY_API_SECRET') ||
        process.env.CLOUDINARY_API_SECRET,
    });
  }

  // Save file to Cloudinary (Hỗ trợ PDF, Images, Docs...)
  async saveFile(
    file: Express.Multer.File,
    folder = 'law_storage',
  ): Promise<string> {
    try {
      if (!file || !file.buffer) {
        throw new BadRequestException('File is required!');
      }

      const allowedExtensions = [
        '.jpg',
        '.jpeg',
        '.png',
        '.pdf',
        '.doc',
        '.docx',
      ];
      const fileExt = extname(file.originalname).toLowerCase();
      if (!allowedExtensions.includes(fileExt)) {
        throw new BadRequestException(
          `Only ${allowedExtensions.join(', ')} files are allowed!`,
        );
      }

      return new Promise<string>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'auto',
            public_id: `${Date.now()}-${file.originalname
              .replace(/\.[^/.]+$/, '')
              .replace(/[^a-zA-Z0-9_-]/g, '_')}`,
          },
          (error: any, result: UploadApiResponse) => {
            if (error) {
              return reject(
                new BadRequestException(
                  `Error uploading to Cloudinary: ${error.message}`,
                ),
              );
            }
            // Trả về secure_url trên Cloudinary
            resolve(result.secure_url);
          },
        );

        uploadStream.end(file.buffer);
      });
    } catch (error: any) {
      throw new BadRequestException(`Error saving file: ${error.message}`);
    }
  }

  // Delete file from Cloudinary (theo URL hoặc publicId)
  async deleteFile(fileUrlOrPublicId: string): Promise<void> {
    try {
      if (!fileUrlOrPublicId) return;

      const publicId = this.extractPublicId(fileUrlOrPublicId);
      await cloudinary.uploader.destroy(publicId, {
        resource_type: fileUrlOrPublicId.endsWith('.pdf') ? 'raw' : 'image',
      });
    } catch (error: any) {
      console.error(`Error deleting file from Cloudinary: ${error.message}`);
    }
  }

  // Download file stream/buffer from Cloudinary
  async downloadFile(
    fileUrl: string,
  ): Promise<{ fileBuffer: Buffer; fileName: string; mimeType: string }> {
    try {
      const response = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
      });

      const fileName = fileUrl.split('/').pop() || 'document.pdf';
      const mimeType =
        response.headers['content-type'] || this.getMimeType(fileName);

      return {
        fileBuffer: Buffer.from(response.data),
        fileName,
        mimeType,
      };
    } catch (error: any) {
      throw new BadRequestException(
        `Error downloading file from Cloudinary: ${error.message}`,
      );
    }
  }

  private extractPublicId(urlOrId: string): string {
    if (!urlOrId.startsWith('http')) {
      return urlOrId;
    }
    const parts = urlOrId.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex !== -1) {
      const pathParts = parts.slice(uploadIndex + 2); // Bỏ qua /upload/v12345/
      const fullPath = pathParts.join('/');
      return fullPath.replace(/\.[^/.]+$/, ''); // Bỏ extension
    }
    return urlOrId;
  }

  private getMimeType(fileName: string): string {
    const ext = extname(fileName).toLowerCase();
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.pdf':
        return 'application/pdf';
      case '.doc':
        return 'application/msword';
      case '.docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      default:
        return 'application/octet-stream';
    }
  }
}
