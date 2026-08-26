import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Res } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/stratergy/jwt.guard';
import { Response } from 'express';

@Controller('review')
// cơ chế review là review mỗi khi booking đã xong
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

// tạo mới review, khi status nó done
// nhận vô 1 cái lawyer_id
  @Post('/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createReviewDto: CreateReviewDto,
  @Req() req, // user đánh giá, 
  @Res() res:Response,
  @Param('id') id:string // đánh giá cho thằng luật sư
) {
    try {
      // khi mà nó tạo xong thì nhớ update cái chỗ rate cho luật sư =))
      const {userId} = req.user
      const response = await this.reviewService.create(createReviewDto,id,userId);
      return res.status(response.status).json(response.message)
    } catch (error) {
      throw new Error(error)
    }
  }
// lấy hết review của chính thằng luật sư đó
  @Get("/:id")
   async findAll( @Param('id') id:string,@Res() res:Response ) {
   try {
    const data = await this.reviewService.findAll(id)
    return res.status(200).json(data)
   } catch (error) {
    throw new Error(error)
   }
  }
// lấy từng review
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewService.findOne(+id);
  }
// sửa review
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto) {
    return this.reviewService.update(+id, updateReviewDto);
  }


// không xóa
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reviewService.remove(+id);
  }
}
