import { ApiProperty } from "@nestjs/swagger";

export class CreateVipPackageDto {
   // tạo từng gói vip
  @ApiProperty({ example: 'Gói 1 tháng cao cấp' })
  name: string;

  // deluxe đồ đó =)) 
  @ApiProperty({example:'deluxe'})
  type: string;

  @ApiProperty({ example: 199000 })
  price: number; //

  @ApiProperty({ type: 'string', format: 'date-time', required: false })
  vip_expired?: Date;

  @ApiProperty({ type: [String], example: ['Ưu tiên tìm kiếm', 'Nổi bật trên trang chủ'] })
  benefits?: string[];
}
