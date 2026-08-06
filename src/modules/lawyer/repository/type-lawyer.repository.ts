import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TypeLawyer, TypeLawyerModelName } from 'libs/schemas';
import { BaseRepository } from 'libs/repository';
import { escapeRegex } from 'libs/utils/regex.util';

@Injectable()
export class TypeLawyerRepository extends BaseRepository<TypeLawyer> {
  constructor(
    @InjectModel(TypeLawyerModelName)
    private readonly typeLawyerModel: Model<TypeLawyer>,
  ) {
    super(typeLawyerModel);
  }

  async findByTypeRegex(type: string): Promise<TypeLawyer[]> {
    const safeType = escapeRegex(type);
    return this.find({ type: { $regex: safeType, $options: 'i' } });
  }
}
