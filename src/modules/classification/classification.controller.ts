import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ClassificationService } from './classification.service';
import {
  ClassificationRequestDto,
  ResponseDto,
  ClassificationDataDto,
} from './dto';

@ApiTags('Classification')
@Controller('classification')
export class ClassificationController {
  constructor(private readonly classificationService: ClassificationService) {}

  @Post('predict')
  @ApiOperation({
    summary: 'Classify problem text into lawyer categories and suggest lawyers',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns category and matching lawyers',
  })
  async classifyText(
    @Body() request: ClassificationRequestDto,
  ): Promise<ResponseDto<ClassificationDataDto>> {
    return this.classificationService.classifyText(request);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get list of available legal problem categories' })
  @ApiResponse({ status: 200, description: 'Returns category list' })
  async getCategories(): Promise<ResponseDto<{ categories: string[] }>> {
    return this.classificationService.getCategories();
  }
}
