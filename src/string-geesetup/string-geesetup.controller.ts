import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { CreateStringGeesetupDto } from './dto/create-string-geesetup.dto';
import { StringGeesetupService } from './string-geesetup.service';

@Controller('string-geesetup')
export class StringGeesetupController {
  constructor(private readonly stringGeesetupService: StringGeesetupService) {}

  @Get('init')
  async init() {
    const restToken = await this.stringGeesetupService.setRestToken();
    return { restToken };
  }

  @Post('create-room')
  async createRoom(@Body() createStringGeesetupDto: CreateStringGeesetupDto) {
    const room = await this.stringGeesetupService.createRoom(createStringGeesetupDto);
    return room;
  }

  @Get('user-token/:userId')
  async getUserToken(@Param('userId') userId: string) {
    const userToken = await this.stringGeesetupService.getUserToken(userId);
    return { userToken };
  }

  @Get('room-token/:roomId')
  async getRoomToken(@Param('roomId') roomId: string) {
    const roomToken = await this.stringGeesetupService.getRoomToken(roomId);
    return { roomToken };
  }

  @Put('delete-room')
  async deleteRoom(@Body('roomId') roomId: string) {
    const result = await this.stringGeesetupService.deleteRoom(roomId);
    return result;
  }
}