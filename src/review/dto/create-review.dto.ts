
import { ApiProperty } from "@nestjs/swagger";


export class CreateReviewDto {
   @ApiProperty()
   rating:number
   @ApiProperty()
   comment:string
}
