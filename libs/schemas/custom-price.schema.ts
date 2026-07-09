import { Prop, Schema } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseSchema, createSchema } from './base.schema/base.schema';
import { ETypeLawyer } from './enums';

// Lawyer custom pricing configuration
@Schema({ timestamps: true, collection: 'customPrices' })
export class CustomPrice extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  lawyer_id: Types.ObjectId;

  @Prop({ enum: ETypeLawyer, required: true, index: true })
  type: ETypeLawyer;

  @Prop()
  price: number;

  @Prop()
  description: string;
}

export const CustomPriceSchema = createSchema(CustomPrice);
CustomPriceSchema.index({ lawyer_id: 1, type: 1 }, { unique: true });

export const CustomPriceModelName = CustomPrice.name;
export const CustomPriceDestination = {
  name: CustomPriceModelName,
  schema: CustomPriceSchema,
};
export type CustomPriceModel = Model<CustomPrice>;
