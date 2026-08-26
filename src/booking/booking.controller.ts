import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}


// những option cho booking: booking trên 1 tháng -10%, 1 năm -20%, có vip thì -5-10%
// người dùng tạo mới booking- tạo thì tạo cho luật sư nào, vào kiểu vụ án gì
  @Post('')
  // hiện ở trong cái chi tiết luật sư á
  // cái này sẽ sẽ nhận vào cái kiểu vụ án mình cần tư vấn
  // tính 1 cái range giá tiền theo cái type đó
  create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingService.create(createBookingDto);
  }

  @Get()
  findAll() {
    return this.bookingService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto) {
    return this.bookingService.update(+id, updateBookingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bookingService.remove(+id);
  }
}
