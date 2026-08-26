import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Res } from '@nestjs/common';
import { VipPackageService } from './vip-package.service';

import { UpdateVipPackageDto } from './dto/update-vip-package.dto';
import { JwtAuthGuard } from 'src/auth/stratergy/jwt.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CreateVipPackageDto } from './dto/create-vippackage.dto';
import { Response } from 'express';

@Controller('vip-package')
export class VipPackageController {
  constructor(private readonly vipPackageService: VipPackageService) {}

 @Post('/createVipPakage')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
   async createVipPackage(@Body() createVipPackageDto: CreateVipPackageDto,
    @Req() req,
    @Res() res: Response
    ) {
  const userId = req.user.userId;
  try {
    const result =  await this.vipPackageService.create(createVipPackageDto,userId);
    return res.status(result.status).json(result.message)
  } catch (error) {
    throw new Error(error)
  }
}
// lấy hết vip package
  @Get('/allPackage')
  async findAll(@Res() res:Response) {
   try {
      const response = await this.vipPackageService.findAll();
      return res.status(response.status).json(response.result)
   } catch (error) {
    throw new Error(error)
   }
  }
// hiện chi tiết vippackage
  @Get('detail/:id')
  async findOne(@Param('id') id: string,
  @Res() res:Response) {
    try {
      const response = await this.vipPackageService.findOne(id);
      return res.status(response.status).json(response.results)
    } catch (error) {
      throw new Error(error)
    }
  }
// sửa chi tiết vip package // chỉ thay đổi giá với ngày thôi, còn quyền lợi nếu muốn thay đổi thì phải vẽ thêm chức năng

// xóa vjp package
  @Delete('delete/:id')
  async remove(@Param('id') id: string,@Res() res:Response) {
    try {
      const result = await this.vipPackageService.remove(id)
      return res.status(result.status).json(result.result)
    } catch (error) {
      throw new Error(error)
    }
  }
// SỬA
  @Patch('update/:id')
  async update(@Param('id') id: string, 
  @Body() updateVipPackageDto: UpdateVipPackageDto,
  @Res()res:Response) {
    try {
    const resposne = await this.vipPackageService.update(id,updateVipPackageDto)
    return res.status(resposne.status).json(resposne.result)
    } catch (error) {
      throw new Error(error)
    }
  }
  
// sang bên user, lấy danh sách các user đang sử dụng gói vip, filter
}

