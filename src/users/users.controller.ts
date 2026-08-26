import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, Res, Req, UploadedFile, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/stratergy/jwt.guard';
import { Response } from 'express';
import { CloudUploadService } from 'src/shared/cloudUpload.service';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/config/database.config';
import { Model } from 'mongoose';
import { ChangeRoleDto } from './dto/change.dto';


// quản lí người dùng là chính
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService,
    private readonly cloudUploadService : CloudUploadService,
    @InjectModel(User.name) private readonly user_model : Model<User>
  ) {}

  // tạo mới người dùng
    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('img'))
 async create(
    @Res() res:Response,
    @Body() body: CreateUserDto,
    @Req() req,
    @UploadedFile() file: Express.Multer.File,
) {
   const userId = req.user.userId;
    try {
      // lấy ảnh
      if(file){
        try {
          const uploadImage = await this.cloudUploadService.uploadImage(file,'avatar');
          body.avartar_url = uploadImage.secure_url
        } catch (error) {
          throw new Error(error)
        }
      }
      // với những cái như ri thì cần phải có 1 cái check admin
      const response = await this.usersService.create(body,userId);
      return res.status(response.status).json({message:response.message})
    } catch (error) {
      throw new Error(error)
    }
  }

// lấy toàn bộ danh sách người dùng sắp xếp theo ngày tạo
  @Get('/getAllUser')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
 async  findAll(@Req() req,
 @Param('role') role:string,
   @Res() res:Response
) {
    const {userId} = req.user
    try {
      const response =  await this.usersService.findAll(userId,role);
      return res.status(response.status).json(response.data)
    } catch (error) {
      throw new Error(error)
    }
    
  }


// lấy chi tiết thông tin người dùng với luật sư, này mình để params
  @Get(':id')
  async  findOne(@Param('id') id: string) {
    try {
      const response = await this.usersService.findOne(id)
      return response
    } catch (error) {
      throw new Error(error)
    }
  }



// updateUser với role là admin

  @Patch('adminUpdateUser/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('img'))

  async update(
  @Param('id') id: string, 
  @Body() updateUserDto: UpdateUserDto,
  @Res() res:Response,
  @Req() req,
  @UploadedFile() file: Express.Multer.File,
  ) {
    // lấy id
    const userId = req.user.userId
    // lấy cái secure_url của cái updateDto hiện tại xong xóa( trong trường hợp có ảnh )
    // lấy ảnh của hiện tại
      const currentUser = await this.user_model.findById(id);
      if (!currentUser) {
        return res.status(404).send({ message: 'User not found' });
      }
      if (file) {
        const uploadResult = await this.cloudUploadService.uploadImage(
          file,
          'avatardd',
        );
      }
    try {
      const response = await this.usersService.updateTheoAdmin(id,updateUserDto,userId)
      return res.status(response.status).json(response.message)
    } catch (error) {
      throw new Error(error)
    }
  }




  // update user với chính bản thân 
  @Patch('/updateMySelf')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('img'))
  async updateMySelf(
  @Body() updateUserDto: UpdateUserDto,
  @Res() res:Response,
  @Req() req,
  @UploadedFile() file: Express.Multer.File
  ){
const userId = req.user.userId
    // lấy cái secure_url của cái updateDto hiện tại xong xóa( trong trường hợp có ảnh )
    // lấy ảnh của hiện tại
      const currentUser = await this.user_model.findById(userId);
      if (file) {
        const uploadResult = await this.cloudUploadService.uploadImage(
          file,
          'avatar',
        );
        updateUserDto.avartar_url = uploadResult.secure_url; // lấy avata hiện tại rồi gán vô, đồng thời xóa cái avatar đằng trong cái cloudinary
        if (currentUser?.avartar_url) {
          const urlParts = currentUser.avartar_url.split('/');
          const publicId = urlParts.slice(-2).join('/').split('.')[0];
          await this.cloudUploadService.deleteImage(publicId);
        }
      }
      try {
        const response = await this.usersService.updateTheoUser(userId,updateUserDto)
        return res.status(response.status).json(response.message)
      } catch (error) {
        
      }
  }
  @Patch('/changeRoleAdmin')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async changeRoleAdmin(
    @Query('id') id: string,
    @Body() dto: ChangeRoleDto,
    @Req() req
  ) {
    try {
      const { userId } = req.user;
      const user = await this.usersService.changeRoleToUser(id, dto.newRole, userId);
      return { status: 200, message: 'Thay đổi role thành công', data: user };
    } catch (error) {
      console.error('Lỗi changeRoleAdmin:', error);
      throw error;
    }
  }
  


  
    // xóa người dùng
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
  @Get('/getListBookingUser/:id')
  async findShiet(
    @Param('id') id: string,
    @Req() req,
    @Res() res:Response
  ){
try {
  const response = await this.usersService.findShiet(id)
  return res.status(response.status).json(response.data)
} catch (error) {
  throw new Error(error)
}
  }
}
