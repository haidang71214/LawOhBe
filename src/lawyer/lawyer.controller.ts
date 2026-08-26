import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Res, Query } from '@nestjs/common';
import { LawyerService } from './lawyer.service';
import { JwtAuthGuard } from 'src/auth/stratergy/jwt.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { CreateVipPackageDto } from '../vip-package/dto/create-vippackage.dto';
import { UpdateLawyerDto } from './dto/update-lawyer.dto';
import { FilterLawyerDto } from './dto/filterLawyer.dto';

@Controller('/lawyer')
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
// lấy những thứ liên quan tới thằng lawyer
// cái typelawyer nó gán cái objectid vô

@Get('filterLawyer')
async getLawyer(@Query() filterDto: FilterLawyerDto, @Res() res: Response) {
  try {
    // Gọi service để lọc luật sư
    const { data: lawyers, total } = await this.lawyerService.filterLawyers(filterDto);

    if (lawyers.length === 0) {
      return res.status(200).json({
        message: 'No lawyers found matching the filter criteria.',
        data: [],
        pagination: {
          page: filterDto.page || 1,
          limit: filterDto.limit || 10,
          total: 0
        }
      });
    }
// lấy thêm giá tiền ở đây
    return res.status(200).json({
      message: ' CableLawyers fetched successfully',
      data: lawyers,
      pagination: {
        page: filterDto.page || 1,
        limit: filterDto.limit || 10,
        total,
        totalPages: Math.ceil(total / (filterDto.limit || 10))
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: 'Error fetching lawyers',
      error: error.message
    });
  }
}
// lấy id của thằng lawyer
@Get('/vLawyer')
  async getDetailLawyer(
    @Query('id') id: string, // Lấy id từ query string
    @Res() res: Response,
  ) {
    try {
      console.log('ID from query:', id);
      const response = await this.lawyerService.getDetailLawyer(id);
      return res.status(200).json({ data: response });
    } catch (error) {
      throw new Error(error);
    }
  }
}
