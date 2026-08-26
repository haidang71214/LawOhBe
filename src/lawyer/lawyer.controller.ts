import { Controller, Get, Body, Patch, Param, Delete, UseGuards, Req, Res, Query } from '@nestjs/common';
import { LawyerService } from './lawyer.service';
import { JwtAuthGuard } from 'src/auth/stratergy/jwt.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { UpdateLawyerDto } from './dto/update-lawyer.dto';
import { FilterLawyerDto } from './dto/filterLawyer.dto';
import { CreateLawyerDto } from './dto/create-lawyer.dto';

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
  @Patch('/adminCreatelawyer/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async updateLawyer(@Body() createLawyerDto: CreateLawyerDto,
  @Param('id') id:string,
  @Res() res:Response,
  @Req() req
) {
const userId = req.user.userId
    try {
      const results = await this.lawyerService.updateLawyer(createLawyerDto,userId,id)
      res.status(results.status).json(results.message)
    } catch (error) {
      throw new Error(error)
    }
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.lawyerService.remove(+id);
  }
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
