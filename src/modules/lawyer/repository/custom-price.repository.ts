import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CustomPrice, CustomPriceModelName } from 'libs/schemas';
import { BaseRepository } from 'libs/repository';

@Injectable()
export class CustomPriceRepository extends BaseRepository<CustomPrice> {
  constructor(
    @InjectModel(CustomPriceModelName)
    private readonly customPriceModel: Model<CustomPrice>,
  ) {
    super(customPriceModel);
  }

  async findByLawyerId(
    lawyerId: string | Types.ObjectId,
  ): Promise<CustomPrice[]> {
    return this.find({ lawyer_id: lawyerId });
  }
}
