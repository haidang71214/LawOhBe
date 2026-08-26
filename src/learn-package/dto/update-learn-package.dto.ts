import { PartialType } from '@nestjs/swagger';
import { CreateLearnPackageDto } from './create-learn-package.dto';

export class UpdateLearnPackageDto extends PartialType(CreateLearnPackageDto) {}
