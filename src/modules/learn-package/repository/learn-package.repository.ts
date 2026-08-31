import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LearnPackage, LearnPackageModelName } from 'libs/schemas';
import { BaseRepository } from 'libs/repository';

@Injectable()
export class LearnPackageRepository extends BaseRepository<LearnPackage> {
  constructor(
    @InjectModel(LearnPackageModelName)
    private readonly packageModel: Model<LearnPackage>,
  ) {
    super(packageModel);
  }
}
