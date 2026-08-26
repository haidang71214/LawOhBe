import { Controller, Get, Post, Body, Patch, Param, Delete, Res, UseInterceptors, UploadedFile, UseGuards, Req, NotFoundException, Query, HttpStatus } from '@nestjs/common';
import { FormService } from './form.service';
import { CreateFormDto } from './dto/create-form.dto';
import { Response } from 'express';
import { ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/stratergy/jwt.guard';
import { StorageService } from 'src/storage/storage.service';
import * as fs from 'fs/promises';
import { resolve } from 'path';
import { FindAllFormDto } from './dto/findAllForm.dto';
import { Form } from 'src/config/database.config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
@Controller('form')
export class FormController {
  constructor(private readonly formService: FormService,
    private readonly storageService : StorageService,
    @InjectModel(Form.name) private FormModel: Model<Form>
  ) {}

  // update form
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('formFile'))// định nghĩa tên cái lấy vô
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createFormDto: CreateFormDto,@Res() res:Response,
@UploadedFile() file : Express.Multer.File, // cái mình thực sự lấy vào
@Req() req
) {
    try {
      const {userId} = req.user
      const uri =  await this.storageService.saveFile(file)
      createFormDto.uri_secure = uri
      await this.formService.create(createFormDto,userId);
      res.status(200).json({message:'create success'})
    } catch (error) {
      throw new Error(error)
    }
  }
// get form
@Get('heheForm')
async findAll(@Query() dto: FindAllFormDto, @Res() res: Response) {
  try {
    const page = Number(dto.page) || 1;
    const limit = Number(dto.limit) || 10;
    const { type } = dto;
    console.log(dto); // Should log { page: 1, limit: 10, type: 'INSURANCE' }
    
    const query = this.FormModel.find();
    if (type) {
      query.where('type').equals(type);
    }

    const data = await query
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
    console.log(data); // Should log the query result
    console.log(query); // Should log the Mongoose query object
    
    return res.status(HttpStatus.OK).json({
      success: true,
      data,
      meta: {
        page,
        limit,
        total: await this.FormModel.countDocuments(type ? { type } : {}),
      },
    });
  } catch (error) {
    console.log(error); // Should log any errors
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to fetch forms: ${error.message}`,
    });
  }
}
// 
  @Get(':id')
   async findOne(@Param('id') id: string,@Res() res:Response) {
    try {
      const data = await this.formService.findOne(id)
      return res.status(data.status).json(data.data)
    } catch (error) {
      throw new Error(error)
    }
  }

// delete file ở đây, ở đây mình xóa theo đường dẫn
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async remove(@Param('id') id: string,@Res() res:Response,@Req() req) {
    try {
      const {userId} = req.user
      await this.formService.remove(id,userId)
      return res.status(200).json({messagge:"delete successful"})
    } catch (error) {
      throw new Error(error)
    }
  }
  // lấy cái id, xong từ cái id sẽ lôi ra file path
  @Get('download/:id')
  async downloadFile(@Param('id') id: string, @Res() res: Response) {
    try {
      const { fileBuffer, fileName, mimeType } = await this.formService.download(id);
      res.set({
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
      });
      res.status(HttpStatus.OK).send(fileBuffer);
    } catch (error) {
      res.status(error.status || HttpStatus.BAD_REQUEST).json({
        message: error.message || 'Error downloading file',
      });
    }
  } 
}
