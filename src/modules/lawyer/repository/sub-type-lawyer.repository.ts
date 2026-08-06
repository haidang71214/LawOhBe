import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SubTypeLawyer, SubTypeLawyerModelName } from 'libs/schemas';
import { BaseRepository } from 'libs/repository';

@Injectable()
export class SubTypeLawyerRepository extends BaseRepository<SubTypeLawyer> {
  constructor(
    @InjectModel(SubTypeLawyerModelName)
    private readonly subTypeLawyerModel: Model<SubTypeLawyer>,
  ) {
    super(subTypeLawyerModel);
  }

  async findByParentType(
    parentType: Types.ObjectId | string,
  ): Promise<SubTypeLawyer[]> {
    return this.find({ parentType });
  }
}
