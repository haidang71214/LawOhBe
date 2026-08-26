  import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
  import { CreateFormDto } from './dto/create-form.dto';
  import { UpdateFormDto } from './dto/update-form.dto';
  import { Form } from 'src/config/database.config';
  import { InjectModel } from '@nestjs/mongoose';
  import { Model } from 'mongoose';
  import { AuthService } from 'src/auth/auth.service';
  import { StorageService } from 'src/storage/storage.service';
  import { FindAllFormDto } from './dto/findAllForm.dto';

  @Injectable()
  export class FormService {
    constructor(
      @InjectModel(Form.name) private FormModel: Model<Form>,
      private readonly authService : AuthService,
      private readonly storageService:StorageService
    ){}
    async create(createFormDto: CreateFormDto,userId:string) {
        try {
          const checkAdmin = await this.authService.checkAdmin(userId);
          if(checkAdmin === false){
            return{
              status:400,
              message:'Khong xax thuc'
            }
          }
          const {uri_secure,mainContent,description,type} = createFormDto
          const newFile = await this.FormModel.create({
            uri_secure,
            mainContent,
            description,
            type
          })
          console.log(newFile);
          return {
            status:200,
            message:newFile
          }
        } catch (error) {
          throw new Error(error)
        }
    }

    async findAll(dto: FindAllFormDto): Promise<Form[]> {
      try {
        const { page = 1, limit = 10, type } = dto;
        
        const query = this.FormModel.find();
        
        if (type) {
          query.where('type').equals(type);
        }
        return await query
          .skip((page - 1) * limit)
          .limit(limit)
          .exec();
      } catch (error) {
        throw new Error(`Failed to fetch forms: ${error.message}`);
      }
    }

    async findOne(id: string) {
      try {
        const data = await this.FormModel.findById(id)
        return {status:200,data}
      } catch (error) {
        throw new Error(error)
      }
    }


    async remove(id:string,userId:string) {
      try {
        if(!userId){
          return{status:404,message:'hong xac thuc'}
        }
    // lấy cái id, đồng thời xóa id và xóa path
      const findPath = await this.FormModel.findById(id);
      if(findPath){
        await this.storageService.deleteFile(findPath?.uri_secure)
      }
      await this.FormModel.findByIdAndDelete(id)
      return {status:200,message:'delete success'}
      } catch (error) {
      throw new Error(error) 
      }
    }
    async download(id: string): Promise<{ fileBuffer: Buffer; fileName: string; mimeType: string }> {
      try {
        // Tìm document theo ID
        const form = await this.FormModel.findById(id);
        if (!form) {
          throw new NotFoundException(`Form with ID ${id} not found`);
        }
        if (!form.uri_secure) {
          throw new NotFoundException(`No file associated with form ID ${id}`);
        }

        // Gọi storageService để tải file theo uri_secure (đường dẫn file)
        return await this.storageService.downloadFile(form.uri_secure);
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        throw new BadRequestException(`Error downloading file: ${error.message}`);
      }
    }
  }
