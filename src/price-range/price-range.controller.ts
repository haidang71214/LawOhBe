import { Controller, Get, Body, Patch, Param, Res, UseGuards, Req, Post } from '@nestjs/common';
import { PriceRangeService } from './price-range.service';
import { UpdatePriceRangeDto } from './dto/update-price-range.dto';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/auth/stratergy/jwt.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CustomPriceRangeDto } from './dto/create-price-range.dto';
import { updatePriceBylawyerDto } from './dto/update-byLawyerDto';

@Controller('price-range')
export class PriceRangeController {
  constructor(private readonly priceRangeService: PriceRangeService) {}
@Post('/LawyerCustomPrice')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
async createFuckingPrice(
@Res() res:Response,
@Body() body:CustomPriceRangeDto,
@Req() req
){
  try {
    const {userId} = req.user
    const response = await this.priceRangeService.createHehe(userId,body)
    return res.status(response.status).json(response.message)
  } catch (error) {
    throw new Error(error)
  }
}
// luật sư update cái giá của từng dịch vụ của họ
@Patch('/LawyerUpdatePrice')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
async updatePriceByLawyer(
@Req() req, 
@Res() res:Response,
@Body() body:updatePriceBylawyerDto
){
try {
  const {userId} = req.user
  const response =await this.priceRangeService.updateLawyerService(userId,body);
  return res.status(response.status).json(response.message)
} catch (error) {
  throw new Error(error)
}
}

  @Get()
  async findAll(@Res() res:Response) {
   try {
    const response = await this.priceRangeService.findAll();
    return res.status(response.status).json(response.results)
  } catch (error) {
    throw new Error(error)
  }
  }

// lấy chi tiết cái range theo market
  @Get(':type')
   async findOne(@Param('type') id: string,@Res() res:Response) {
    try {
        const response = await this.priceRangeService.findOne(id);
        return res.status(response.status).json(response.message)
    } catch (error) {
      throw new Error(error)
    }
  }

// chỉnh sửa cái range với market
  @Patch(':type')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async update(@Param('type') type: string, @Body() updatePriceRangeDto: UpdatePriceRangeDto,@Req() req,@Res() res:Response) {
try {
  const userId = req.user.userId
  await  this.priceRangeService.update(type, updatePriceRangeDto,userId);
  return res.status(200).json({message:"Update thành công"})
} catch (error) {
  throw new Error(error)
}}
}
