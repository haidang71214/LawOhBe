import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Res } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from 'src/auth/stratergy/jwt.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

// tạo comment mới
  @Post('/createNewComment/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async create(@Body() createCommentDto: CreateCommentDto,
  @Param('id') id:string,
  @Req() req
) {
  try {
    const {userId} = req.user
    return this.commentService.create(createCommentDto,userId,id)
  } catch (error) {
    throw new Error(error)
  }
  }
// lấy comment của cái video đó / hình như có rồi thì phải
// xóa comment
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async remove(@Param('id') id: string,
    @Req() req,
    @Res() res:Response
) {
    try {
      const {userId} = req.user;
      await this.commentService.remove(id,userId)
    } catch (error) {
      throw new Error(error)
    }
  }
}
