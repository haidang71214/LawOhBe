import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { HTTP_MESSAGE } from 'libs/constant';

export class ResponseDto<T = any> {
  @ApiProperty({ type: String, example: 'Success' })
  message?: string = HTTP_MESSAGE.OK;

  @ApiProperty({ required: false })
  data?: T;

  @ApiProperty({ required: false })
  processId?: string;

  @ApiProperty({ type: Number, example: 200 })
  statusCode?: number = HttpStatus.OK;

  @ApiProperty({ required: false })
  duration?: string;

  constructor(data?: Partial<ResponseDto<T>>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static success<T>(
    data?: T,
    message: string = HTTP_MESSAGE.OK,
    statusCode: number = HttpStatus.OK,
    duration?: string,
    processId?: string,
  ): ResponseDto<T> {
    return new ResponseDto<T>({
      data,
      message,
      statusCode,
      duration,
      processId,
    });
  }

  static error<T>(
    message: string = HTTP_MESSAGE.INTERNAL_SERVER_ERROR,
    statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
    data?: T,
    duration?: string,
    processId?: string,
  ): ResponseDto<T> {
    return new ResponseDto<T>({
      data,
      message,
      statusCode,
      duration,
      processId,
    });
  }
}
