import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateLearnPackageDto {
  @ApiProperty({ description: 'Tên gói học', example: 'Gói Pháp Luật Doanh Nghiệp Cơ Bản' })
  @IsNotEmpty({ message: 'Tên gói học không được để trống' })
  @IsString({ message: 'Tên gói học phải là chuỗi' })
  name: string;

  @ApiProperty({ description: 'Giá gói học (VND)', example: 500000 })
  @IsNotEmpty({ message: 'Giá gói học không được để trống' })
  @IsNumber({}, { message: 'Giá gói học phải là số' })
  @Min(0, { message: 'Giá gói học không được âm' })
  price: number;

  @ApiPropertyOptional({ 
    description: 'Hạng gói học', 
    enum: ['none', 'standard', 'gold', 'deluxe'], 
    default: 'none' 
  })
  @IsOptional()
  @IsEnum(['none', 'standard', 'gold', 'deluxe'], { message: 'Loại gói học không hợp lệ' })
  type?: string;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết quyền lợi gói học' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Ngày bắt đầu khóa học' })
  @IsOptional()
  learn_start?: Date;

  @ApiPropertyOptional({ description: 'Ngày kết thúc khóa học' })
  @IsOptional()
  learn_end?: Date;

  @ApiPropertyOptional({ description: 'Trạng thái hoạt động', default: true })
  @IsOptional()
  is_active?: boolean;
}
