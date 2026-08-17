import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MarketPriceRange, MarketPriceRangeModelName } from 'libs/schemas';
import { BaseRepository } from 'libs/repository';

@Injectable()
export class PriceRangeRepository extends BaseRepository<MarketPriceRange> {
  constructor(
    @InjectModel(MarketPriceRangeModelName)
    private readonly priceRangeModel: Model<MarketPriceRange>,
  ) {
    super(priceRangeModel);
  }
}
