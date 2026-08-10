import { PartialType } from '@nestjs/swagger';
import { CreateNewsDto } from './create-news.request.dto';

export class UpdateNewsDto extends PartialType(CreateNewsDto) {}
export class UpdateNewsRequestDto extends UpdateNewsDto {}
