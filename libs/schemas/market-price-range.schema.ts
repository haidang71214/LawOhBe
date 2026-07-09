import { Prop, Schema } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseSchema, createSchema } from './base.schema/base.schema';
import { ETypeLawyer } from './enums';

@Schema({ timestamps: true, collection: 'MarketPriceRanges' })
export class MarketPriceRange extends BaseSchema {
  @Prop({ required: true, enum: ETypeLawyer, unique: true, index: true })
  type: ETypeLawyer;

  @Prop({ required: true, min: 0 })
  minPrice: number;

  @Prop({ required: true, min: 0 })
  maxPrice: number;

  @Prop({ required: false })
  description: string;
}

export const MarketPriceRangeSchema = createSchema(MarketPriceRange);
export const MarketPriceRangeModelName = MarketPriceRange.name;
export const MarketPriceRangeDestination = {
  name: MarketPriceRangeModelName,
  schema: MarketPriceRangeSchema,
};
export type MarketPriceRangeModel = Model<MarketPriceRange>;
