import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { extname, join, resolve } from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class StorageService {
  private storageDir = join(process.cwd(), 'storage');

  // Ensure storage directory exists
  async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
    } catch (error: any) {
      throw new BadRequestException(`Error creating directory: ${error.message}`);
    }
  }

  // Save file
  async saveFile(file: Express.Multer.File): Promise<string> {
    try {
      await this.ensureDirectoryExists();
      const allowedExtensions = ['.jpg', '.jpeg', '.pdf'];
      const fileExt = extname(file.originalname).toLowerCase();
      if (!allowedExtensions.includes(fileExt)) {
        throw new BadRequestException('Only JPG and PDF files are allowed!');
      }
      const uniqueFileName = `${Date.now()}-${file.originalname}`;
      const filePath = join(this.storageDir, uniqueFileName);
      await fs.writeFile(filePath, file.buffer);
      return filePath;
    } catch (error: any) {
      throw new BadRequestException(`Error saving file: ${error.message}`);
    }
  }

  // Delete file by full file path
  async deleteFile(filePath: string): Promise<void> {
    try {
      const resolvedPath = resolve(filePath);
      if (!resolvedPath.startsWith(resolve(this.storageDir))) {
        throw new BadRequestException('Invalid file path: Access outside storage directory is not allowed!');
      }
      await fs.access(resolvedPath);
      await fs.unlink(resolvedPath);
      console.log(`File at ${resolvedPath} deleted successfully!`);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new NotFoundException(`File at ${filePath} not found!`);
      }
      throw new BadRequestException(`Error deleting file: ${error.message}`);
    }
  }

  // Get file path
  async getFilePath(fileName: string): Promise<string> {
    try {
      const filePath = join(this.storageDir, fileName);
      await fs.access(filePath);
      return filePath;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new NotFoundException(`File ${fileName} not found!`);
      }
      throw new BadRequestException(`Error accessing file: ${error.message}`);
    }
  }
  private getMimeType(fileName: string): string {
    const ext = extname(fileName).toLowerCase();
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.pdf':
        return 'application/pdf';
      default:
        return 'application/octet-stream';
    }
  }

  // Download file by file path
  async downloadFile(filePath: string): Promise<{ fileBuffer: Buffer; fileName: string; mimeType: string }> {
    try {
      const resolvedPath = resolve(filePath);
      // Kiểm tra xem đường dẫn có nằm trong storageDir không
      if (!resolvedPath.startsWith(resolve(this.storageDir))) {
        throw new BadRequestException('Invalid file path: Access outside storage directory is not allowed!');
      }
      // Kiểm tra sự tồn tại của file
      await fs.access(resolvedPath);
      const fileBuffer = await fs.readFile(resolvedPath);
      const fileName = resolvedPath.split('/').pop() || resolvedPath; // Lấy tên file từ đường dẫn
      const mimeType = this.getMimeType(fileName);
      return { fileBuffer, fileName, mimeType };
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new NotFoundException(`File at ${filePath} not found!`);
      }
      throw new BadRequestException(`Error downloading file: ${error.message}`);
    }
  }
  
  
}