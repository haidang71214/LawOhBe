import { PartialType } from '@nestjs/swagger';
import { CreateFormDto } from './create-form.request.dto';

export class UpdateFormDto extends PartialType(CreateFormDto) {}
export class UpdateFormRequestDto extends UpdateFormDto {}
