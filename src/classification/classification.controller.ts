import { Controller, Get, Post, Body } from '@nestjs/common';
import { ClassificationService } from './classification.service';
import { ClassificationRequestDto, ClassificationResponseDto } from './classification.dto';

@Controller('classification')
export class ClassificationController {
  constructor(private readonly classificationService: ClassificationService) {}

  @Get()
  async root() {
    return {
      message: 'Legal Text Classification API',
      description: 'Gửi POST request đến /classification/classify để phân loại văn bản pháp lý',
    };
  }

  @Post('classify')
  async classifyText(
    @Body() request: ClassificationRequestDto,
  ){
    return this.classificationService.classifyText(request);
  }

  @Get('categories')
  async getCategories() {
    return this.classificationService.getCategories();
  }
}