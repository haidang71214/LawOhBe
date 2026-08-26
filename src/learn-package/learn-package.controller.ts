import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/auth/stratergy/jwt.guard';
import { CreateLearnPackageDto } from './dto/create-learn-package.dto';
import { UpdateLearnPackageDto } from './dto/update-learn-package.dto';
import { LearnPackageService } from './learn-package.service';

@ApiTags('Learn Package')
@Controller('learn-package')
export class LearnPackageController {
  constructor(private readonly learnPackageService: LearnPackageService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin tạo gói học mới' })
  async create(
    @Body() createDto: CreateLearnPackageDto,
    @Req() req,
    @Res() res: Response,
  ) {
    const { userId } = req.user;
    const result = await this.learnPackageService.create(createDto, userId);
    return res.status(result.status).json(result);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả các gói học' })
  async findAll(@Res() res: Response) {
    const result = await this.learnPackageService.findAll();
    return res.status(result.status).json(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một gói học' })
  async findOne(@Param('id') id: string, @Res() res: Response) {
    const result = await this.learnPackageService.findOne(id);
    return res.status(result.status).json(result);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin cập nhật thông tin gói học' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateLearnPackageDto,
    @Req() req,
    @Res() res: Response,
  ) {
    const { userId } = req.user;
    const result = await this.learnPackageService.update(id, updateDto, userId);
    return res.status(result.status).json(result);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin xóa một gói học' })
  async remove(@Param('id') id: string, @Req() req, @Res() res: Response) {
    const { userId } = req.user;
    const result = await this.learnPackageService.remove(id, userId);
    return res.status(result.status).json(result);
  }

  @Post('subscribe/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Người dùng đăng ký tham gia gói học' })
  async subscribe(@Param('id') id: string, @Req() req, @Res() res: Response) {
    const { userId } = req.user;
    const result = await this.learnPackageService.subscribe(id, userId);
    return res.status(result.status).json(result);
  }
}
