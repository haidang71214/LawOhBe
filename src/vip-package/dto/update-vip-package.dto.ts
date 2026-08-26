import { ApiProperty, PartialType } from '@nestjs/swagger';

export class UpdateVipPackageDto {
   @ApiProperty({ example: 'Gói 1 tháng cao cấp' })
     description: string;
   
     @ApiProperty({ example: 199000 })
     price: number; //
   
     @ApiProperty({ type: 'string', format: 'date-time', required: false })
     vip_expired?: Date;
   
     @ApiProperty({ type: [String], example: ['Ưu tiên tìm kiếm', 'Nổi bật trên trang chủ'] })
     benefits?: string[];
}
