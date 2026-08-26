import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, Res, Req, UploadedFile, Query, UploadedFiles } from '@nestjs/common';
import { VideoService } from './video.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { JwtAuthGuard } from 'src/auth/stratergy/jwt.guard';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { AnyFilesInterceptor, FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { CloudUploadService } from 'src/shared/cloudUpload.service';
import { AcceptRejectDto } from './dto/acceptRejectBody';

@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService,
    private readonly CloudUploadService : CloudUploadService
  ) {}
// tạo video mới
// admin xác thực/ gửi link
//list video theo type
// xóa video nêu lí do
  @Post('/createNewVideo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  // cho cái này đẩy lên nhiều 1 cái là video 2 là thubnail
  @UseInterceptors(AnyFilesInterceptor()) // cái này làm để cho 2 cái type khác loại truyền vô được
 async create(@Body() createVideoDto: CreateVideoDto,
  @Res() res:Response,
  @Req() req,
  // upload nhiều file, sẽ tách ra ở bên dưới
  @UploadedFiles() files:Array<Express.Multer.File>
) {
  try {
    const {userId} = req.user;
    // nếu có file thì làm, còn kh thì báo lỗi đ
    const video = files.find((file)=> file.fieldname === 'video'); // lấy cái file từ cái fieldName của nó
    const thumbnail = files.find((file)=>file.fieldname === 'thubnail');
    console.log(video,thumbnail);
    
    if (!video && !thumbnail) {
      return res.status(400).json({ message: 'At least one file (video or thumbnail) is required' });
    }
    if(video){
      const hehe = await this.CloudUploadService.uploadVideo(video,'video');
      createVideoDto.video_url = hehe.secure_url
    }
    if(thumbnail){
      const hoho = await this.CloudUploadService.uploadImage(thumbnail,'thubnail')
      createVideoDto.thubnail_url = hoho.secure_url
    }
    console.log(createVideoDto);
    
    const response = await this.videoService.create(createVideoDto,userId);
    return res.status(response.status).json({message:'Tạo thành công'})
  } catch (error) {
    throw new Error(error);
    
  }  
}

// lấy video và filter video theo những cái video được accept
@Get('/getvideoPublic')
async findAll(
  @Query('page') page: string = '1',
  @Query('limit') limit: string = '10',
  @Query('type') type?: string,
) {
  const filters = {
    page: Number(page),
    limit: Number(limit),
    type,
  };
  return this.videoService.findAll(filters);
}
@Get('/getPrivateVideo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getSelf(
    @Req() req: any,
    @Res() res: Response,
  ) {
    try {
      const {userId} = req.user
      const response = await this.videoService.getPrivateVideo(userId);
      return res.status(response.status).json({ data: response.data });
    } catch (error) {
      return res.status(500).json({
        status: 500,
        message: 'Đã xảy ra lỗi',
        error: error.message,
      });
    }
  }
// lấy chi tiết của cái video đó
  @Get(':id')
  async findOne(@Param('id') id: string,@Res() res:Response) {
   try {
    const response = await this.videoService.findOne(id);
    return res.status(response.status).json({response})
   } catch (error) {
    throw new Error(error)
   }
  }
// accept hoặc reject với role admin + gửi mail
  @Patch('/acceptOrReject/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async updateOne(
    @Param('id') id:string,
    @Body() body: AcceptRejectDto,
    @Req() req,
    @Res() res:Response
  ){
    try {
      const {userId} = req.user
      const response = await this.videoService.acceptOrReject(body,userId,id)
      return res.status(response.status).json(response.message)
    } catch (error) {
      throw new Error(error);
      
    }
  }
// hiện tất cả video (admin)
@Get('/getAllVideoAdmin/:status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getAllVideo(
    @Req() req: any,
    @Param('status') status: string,
    @Res() res: Response,
  ) {
    try {
      const { userId } = req.user;
      const response = await this.videoService.getAllForAdmin(userId, status);
      return res.status(response.status).json(response);
    } catch (error) {
      return res.status(500).json({
        status: 500,
        message: 'Đã xảy ra lỗi',
        error: error.message,
      });
    }
  }
//get thêm 1 cái nữa, đó là góc nhìn của cái thằng đăng bài á

// xóa thì ai xóa cũng được, miễn cái đó mình quản lí hoặc là của admin là xóa được
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
 async  remove(@Param('id') id: string,
@Req() req,
@Res() res
) {
   try {
    const {userId} = req.user;
    await this.videoService.remove(id,userId)
    return res.status(200).json({message:'Xóa thành công'})
   } catch (error) {
    throw new Error(error)
   }
  }
}
