import { PartialType } from '@nestjs/swagger';
import { CreateLearnPackageDto } from './create-learn-package.request.dto';

export class UpdateLearnPackageDto extends PartialType(CreateLearnPackageDto) {}
export class UpdateLearnPackageRequestDto extends UpdateLearnPackageDto {}
