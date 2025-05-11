import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Res } from '@nestjs/common';
import { LawyerService } from './lawyer.service';
import { JwtAuthGuard } from 'src/auth/stratergy/jwt.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { CreateVipPackageDto } from '../vip-package/dto/create-vippackage.dto';
import { UpdateLawyerDto } from './dto/update-lawyer.dto';

@Controller('lawyer')
export class LawyerController {
  constructor(private readonly lawyerService: LawyerService,
  ) {}
// luật sư sẽ được tạo bên chỗ user

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findAll(
    @Res() res:Response,
    @Req() req
  ) {
    try {
      const response = await this.lawyerService.findAllLawyer();
      return res.status(response.status).json(response.response)
    } catch (error) {
      throw new Error(error)
    }
  }
// lấy chi tiết luật sư, bao gồn số sao, bài đánh giá, phần giới thiệu và giá
  @Patch('/lawyerUpdate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async update(@Body() updateLawyerDto: UpdateLawyerDto,
  @Res() res:Response,
  @Req() req
) {
  // update giới thiệu, update chuyên ngành với update chuyên ngành chi tiết
  const userId = req.user.userId
    try {
      const results = await this.lawyerService.update(updateLawyerDto,userId)
      res.status(results.status).json(results.message)
    } catch (error) {
      throw new Error(error)
    }
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.lawyerService.remove(+id);
  }
}
