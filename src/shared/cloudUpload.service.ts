import { Inject, Injectable } from "@nestjs/common";
import {UploadApiResponse } from "cloudinary";

// tiến hành upload lên cloud, nên mình sẽ chia từng mảnh nhỏ
// tí mình sẽ import cái này vào cái module tổng
// từ đó có thể xài cho nhiều thằng 
@Injectable() 
export class CloudUploadService{
   constructor(@Inject('CLOUDINARY') private readonly cloudinary){}
   async uploadImage(file: Express.Multer.File, folder: string): Promise<UploadApiResponse> {
      return new Promise((resolve,reject)=>{
         const uploadStream = this.cloudinary.uploader.upload_stream(
            // chia nhỏ, defile folder trên cloudinary
            {folder},
            // tiến hành upload hình lên cloudinary
            (error:any,result:UploadApiResponse)=>{
               if (error) {
                  reject(error)
                  throw new Error('Lỗi'); 
               }else{
                  // nếu có cái trả về thì lấy ở đây
                  resolve(result);
               }
            }
         );
         uploadStream.end(file.buffer)
      })
   }
   async deleteImage(publicId: string): Promise<any> {
      try {
         // Thay thế %20 bằng khoảng trắng
         publicId = publicId.replace(/%20/g, ' ');
   
         // Gọi API xóa ảnh
         const result = await this.cloudinary.api.delete_resources(
            [publicId], 
            { resource_type: 'image' } 
         );
         console.log(`Result of deletion:`, result);
         if (result.deleted[publicId] === 'not_found') {
            throw new Error(`Image with public ID "${publicId}" not found.`);
         }
         console.log(`Image "${publicId}" deleted successfully.`);
      } catch (error) {
         console.error(`Error deleting image: ${error.message}`);
         throw new Error('Error deleting image from Cloudinary');
      }
   }
  
   async uploadVideo(file: Express.Multer.File, folder: string): Promise<UploadApiResponse> {
      return new Promise((resolve, reject) => {
         const uploadStream = this.cloudinary.uploader.upload_stream(
            {
               folder,
               resource_type: 'video',
            },
            (error: any, result: UploadApiResponse) => {
               if (error) {
                  reject(error);
                  throw new Error('Lỗi');  
               
               } else {
                  resolve(result);
               }
            }
         );
         uploadStream.end(file.buffer);
      });
   }
   
   async deleteVideo(publicId: string): Promise<any> {
      try {
         publicId = publicId.replace(/%20/g, ' ');

         const result = await this.cloudinary.api.delete_resources(
            [publicId],
            { resource_type: 'video' }
         );
         console.log(`Result of deletion:`, result);
         if (result.deleted[publicId] === 'not_found') {
            throw new Error(`Video with public ID "${publicId}" not found.`);
         }
         console.log(`Video "${publicId}" deleted successfully.`);
      } catch (error) {
         console.error(`Error deleting video: ${error.message}`);
         throw new Error('Error deleting video from Cloudinary');
      }
   }
// xóa nhiều ảnh trong cloud
async deleteMultipleImages(publicIds: string[]): Promise<any[]> {
   try {
     // Thay thế %20 trong từng publicId
     const sanitizedIds = publicIds.map((id) => id.replace(/%20/g, ' '));

     const result = await this.cloudinary.api.delete_resources(
       sanitizedIds,
       { resource_type: 'image' }
     );

     // Kiểm tra kết quả và trả về trạng thái của từng ảnh
     const deletionResults = sanitizedIds.map((id) => {
       if (result.deleted[id] === 'not_found') {
         return { id, status: 'not_found' };
       }
       return { id, status: 'deleted' };
     });

     return deletionResults;
   } catch (error) {
     console.error(`Error deleting multiple images: ${error.message}`);
     throw new Error('Error deleting multiple images from Cloudinary');
   }
 };
 // upload nhiều ảnh
 async uploadMultipleImages(files: Express.Multer.File[], folder: string): Promise<UploadApiResponse[]> {
   try {
     const uploadPromises = files.map((file) => this.uploadImage(file, folder));
     const uploadResults = await Promise.all(uploadPromises);
     return uploadResults;
   } catch (error) {
     console.error('Error uploading multiple images:', error.message);
     throw new Error('Error uploading multiple images to Cloudinary');
   }
 }
}