import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, Req, Res, UploadedFiles } from '@nestjs/common';
import { NewsService } from './news.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { JwtAuthGuard } from 'src/auth/stratergy/jwt.guard';
import { ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CloudUploadService } from 'src/shared/cloudUpload.service';
import { Response } from 'express';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService,
     private readonly cloudUploadService : CloudUploadService,
  ) {}
@ApiConsumes('multipart/form-data')
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()

  // lấy cái imgs ở chỗ đó ra
  @UseInterceptors(FilesInterceptor('imgs'))
  async create(@Body() createNewsDto: CreateNewsDto,
  @Req() req,
  @Res() res:Response,
  @UploadedFiles() files:Array<Express.Multer.File>
) {
  try {
    const {userId} =req.user
    if(files){
      const data =  await this.cloudUploadService.uploadMultipleImages(files,'imageNews')
      createNewsDto.image_urls = data.map((data) =>{
        return data.secure_url})
    }
    const response = await this.newsService.create(createNewsDto,userId);
    return res.status(200).json({response})
  } catch (error) {
    throw new Error(error)
  }
    }
// get cái news của chính lawyer đó
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findAll(
    @Req() req,
    @Res () res:Response,
  ){
   try {
    const {userId} = req.user
    const response =  await this.newsService.findAll(userId);
    return res.status(response.status).json(response.message)
   } catch (error) {
    throw new Error(error)
   }
  }
  // get toàn bộ news
  @Get('/GetAllNews')
  async findAllNews(
  @Res() res:Response
  ){
    try {
      const response = await this.newsService.getAllFuckingShit();
      return res.status(200).json(response)
    } catch (error) {
      throw new Error(error)
    }
  }

// lấy chi tiết của cái news đó
  @Get(':id')
  async findOne(@Param('id') id: string,
@Res() res:Response) {
    try {
      const response = await this.newsService.findOne(id)
      return res.status(200).json({response})
    } catch (error) {
      throw new Error(error)
    }
  }

// chuyển trạng thái từ chưa accept thành đã accept
  @Patch('AcceptNews/:id')
  async update(@Param('id') id: string,
@Res() res:Response) {
    try {
        const response = await this.newsService.update(id)
        return res.status(200).json({message:"oce", response})
    } catch (error) {
      throw new Error(error);
      
    }
  }

// xóa cái news đó
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async remove(@Param('id') id: string,
@Res() res:Response,
@Req() req
) {
   try {
    const {userId} = req.user
    const response = await this.newsService.remove(id,userId);
    return res.status(200).json({response})
   } catch (error) {
    throw new Error(error);
   }
  }
  
}
