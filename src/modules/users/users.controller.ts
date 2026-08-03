import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  ChangeRoleDto,
  RequestLawyerRoleDto,
  RejectLawyerRequestDto,
  ResponseDto,
  UserItemResponseDto,
  UserListResponseDataDto,
} from './dto';
import { PaginationQueryDto } from 'libs/dto/pagination.dto';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CloudUploadService } from 'src/shared/cloudinary/cloudUpload.service';
import { AuthorizerDecorator, RoleDecorator, UserData } from 'libs/decorators';
import { AuthorizedMetadata } from 'libs/interfaces/auth/authorize.response';
import { USER_ROLE } from 'libs/constant';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudUploadService: CloudUploadService,
  ) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('img'))
  async createUser(
    @Body() body: CreateUserDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ResponseDto<UserItemResponseDto>> {
    if (file) {
      const uploadImage = await this.cloudUploadService.uploadImage(
        file,
        'avatar',
      );
      body.avartar_url = uploadImage.secure_url;
    }
    return this.usersService.createUser(body);
  }

  @Get()
  @AuthorizerDecorator({ secured: true })
  @RoleDecorator(USER_ROLE.ADMIN)
  async findAllUsers(
    @UserData() user: AuthorizedMetadata,
    @Query() queryDto: PaginationQueryDto,
  ): Promise<ResponseDto<UserListResponseDataDto>> {
    return this.usersService.findAllUsers(user.userId, queryDto);
  }

  // 1. User gửi yêu cầu xin cấp quyền làm Luật sư (kèm mô tả, kinh nghiệm, ảnh chứng chỉ)
  @Post('/request-lawyer')
  @AuthorizerDecorator({ secured: true })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('certificate_files'))
  async requestLawyerRole(
    @UserData() user: AuthorizedMetadata,
    @Body() body: RequestLawyerRoleDto,
    @UploadedFiles() files?: Array<Express.Multer.File>,
  ): Promise<ResponseDto<UserItemResponseDto>> {
    return this.usersService.requestLawyerRole(user.userId, body, files);
  }

  // 2. Admin lấy danh sách các yêu cầu xin cấp quyền làm Luật sư đang chờ duyệt
  @Get('/lawyer-requests')
  @AuthorizerDecorator({ secured: true })
  @RoleDecorator(USER_ROLE.ADMIN)
  async getLawyerRequests(
    @UserData() user: AuthorizedMetadata,
    @Query() queryDto: PaginationQueryDto,
  ): Promise<ResponseDto<UserListResponseDataDto>> {
    return this.usersService.getLawyerRequests(queryDto);
  }

  // 3. Admin chấp thuận yêu cầu nâng quyền lên Luật sư
  @Patch('/lawyer-requests/:id/accept')
  @AuthorizerDecorator({ secured: true })
  @RoleDecorator(USER_ROLE.ADMIN)
  async acceptLawyerRequest(
    @Param('id') id: string,
    @UserData() user: AuthorizedMetadata,
  ): Promise<ResponseDto<UserItemResponseDto>> {
    return this.usersService.acceptLawyerRequest(id, user.userId);
  }

  // 4. Admin từ chối yêu cầu nâng quyền lên Luật sư
  @Patch('/lawyer-requests/:id/reject')
  @AuthorizerDecorator({ secured: true })
  @RoleDecorator(USER_ROLE.ADMIN)
  async rejectLawyerRequest(
    @Param('id') id: string,
    @Body() body: RejectLawyerRequestDto,
    @UserData() user: AuthorizedMetadata,
  ): Promise<ResponseDto<UserItemResponseDto>> {
    return this.usersService.rejectLawyerRequest(id, body.reason, user.userId);
  }

  @Get('/:id')
  async getUserById(@Param('id') id: string): Promise<ResponseDto<any>> {
    return this.usersService.getUserById(id);
  }

  @Patch('/me')
  @AuthorizerDecorator({ secured: true })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('img'))
  async updateUserProfile(
    @UserData() user: AuthorizedMetadata,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ResponseDto<null>> {
    if (file) {
      const uploadImage = await this.cloudUploadService.uploadImage(
        file,
        'avatar',
      );
      updateUserDto.avartar_url = uploadImage.secure_url;
    }
    return this.usersService.updateUserProfile(user.userId, updateUserDto);
  }

  @Patch('/:id')
  @AuthorizerDecorator({ secured: true })
  @RoleDecorator(USER_ROLE.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('img'))
  async updateUserByAdmin(
    @Param('id') id: string,
    @UserData() user: AuthorizedMetadata,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ResponseDto<null>> {
    if (file) {
      const uploadImage = await this.cloudUploadService.uploadImage(
        file,
        'avatar',
      );
      updateUserDto.avartar_url = uploadImage.secure_url;
    }
    return this.usersService.updateUserByAdmin(id, updateUserDto, user.userId);
  }

  @Patch('/:id/role')
  @AuthorizerDecorator({ secured: true })
  @RoleDecorator(USER_ROLE.ADMIN)
  async changeUserRole(
    @Param('id') id: string,
    @Body() changeRoleDto: ChangeRoleDto,
    @UserData() user: AuthorizedMetadata,
  ): Promise<ResponseDto<UserItemResponseDto>> {
    return this.usersService.changeUserRole(
      id,
      changeRoleDto.newRole,
      user.userId,
    );
  }

  @Get('/:id/bookings')
  async getUserBookings(@Param('id') id: string): Promise<ResponseDto<any[]>> {
    return this.usersService.getUserBookings(id);
  }
}
