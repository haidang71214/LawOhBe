import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  Query,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { VideoService } from './video.service';
import {
  CreateVideoDto,
  AcceptRejectDto,
  ResponseDto,
  VideoItemResponseDto,
  VideoListResponseDataDto,
} from './dto';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { CloudUploadService } from 'src/shared/cloudinary/cloudUpload.service';
import { AuthorizerDecorator, RoleDecorator, UserData } from 'libs/decorators';
import { AuthorizedMetadata } from 'libs/interfaces/auth/authorize.response';
import { USER_ROLE } from 'libs/constant';
import { PaginationQueryDto } from 'libs/dto/pagination.dto';

@ApiTags('video')
@Controller('video')
export class VideoController {
  constructor(
    private readonly videoService: VideoService,
    private readonly cloudUploadService: CloudUploadService,
  ) {}

  @Post()
  @AuthorizerDecorator({ secured: true })
  @RoleDecorator(USER_ROLE.LAWYER)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  async createVideo(
    @Body() createVideoDto: CreateVideoDto,
    @UserData() user: AuthorizedMetadata,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ): Promise<ResponseDto<VideoItemResponseDto>> {
    console.log(
      '[VideoController.createVideo] Received createVideoDto:',
      createVideoDto,
    );
    console.log(
      '[VideoController.createVideo] Received files:',
      files?.map((f) => ({
        fieldname: f.fieldname,
        originalname: f.originalname,
        size: f.size,
      })),
    );
    const video = files?.find((file) => file.fieldname === 'video');
    const thumbnail = files?.find(
      (file) => file.fieldname === 'thubnail' || file.fieldname === 'thumbnail',
    );
    if (!video && !thumbnail) {
      throw new BadRequestException(
        'At least one file (video or thumbnail) is required',
      );
    }
    const [videoUploadResult, thumbnailUploadResult] = await Promise.all([
      video
        ? this.cloudUploadService.uploadVideo(video, 'video')
        : Promise.resolve(null),
      thumbnail
        ? this.cloudUploadService.uploadImage(thumbnail, 'thubnail')
        : Promise.resolve(null),
    ]);
    if (videoUploadResult) {
      createVideoDto.video_url = videoUploadResult.secure_url;
    }
    if (thumbnailUploadResult) {
      createVideoDto.thubnail_url = thumbnailUploadResult.secure_url;
    }
    return this.videoService.createVideo(createVideoDto, user.userId);
  }

  @Get('/public')
  async getPublicVideos(
    @Query() queryDto: PaginationQueryDto,
    @Query('type') type?: string,
  ): Promise<ResponseDto<VideoListResponseDataDto>> {
    const filters = {
      ...queryDto,
      type,
    };
    return this.videoService.getPublicVideos(filters);
  }

  @Get('/my-videos')
  @AuthorizerDecorator({ secured: true })
  async getMyVideos(
    @UserData() user: AuthorizedMetadata,
    @Query() queryDto: PaginationQueryDto,
  ): Promise<ResponseDto<VideoListResponseDataDto>> {
    return this.videoService.getMyVideos(user.userId, queryDto);
  }

  @Get('/admin')
  @AuthorizerDecorator({ secured: true })
  @RoleDecorator(USER_ROLE.ADMIN)
  async getAdminVideos(
    @UserData() user: AuthorizedMetadata,
    @Query('status') status: string,
    @Query() queryDto: PaginationQueryDto,
  ): Promise<ResponseDto<VideoListResponseDataDto>> {
    return this.videoService.getAdminVideos(user.userId, status, queryDto);
  }

  @Get('/:id')
  async getVideoById(@Param('id') id: string): Promise<ResponseDto<any>> {
    return this.videoService.getVideoById(id);
  }

  @Patch('/:id/moderate')
  @AuthorizerDecorator({ secured: true })
  @RoleDecorator(USER_ROLE.ADMIN)
  async moderateVideo(
    @Param('id') id: string,
    @Body() body: AcceptRejectDto,
    @UserData() user: AuthorizedMetadata,
  ): Promise<ResponseDto<null>> {
    return this.videoService.moderateVideo(body, user.userId, id);
  }

  @Delete('/:id')
  @AuthorizerDecorator({ secured: true })
  async removeVideo(
    @Param('id') id: string,
    @UserData() user: AuthorizedMetadata,
  ): Promise<ResponseDto<null>> {
    return this.videoService.removeVideo(id, user.userId);
  }
}
