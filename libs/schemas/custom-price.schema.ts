import { Prop, Schema } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseSchema, createSchema } from './base.schema/base.schema';
import { ETypeLawyer } from './enums';

// này là luật sư tạo để setup giá
// đâyyy,thằng lawyer sẽ lấy cái này ra để setup giá
@Schema({ timestamps: true, collection: 'customPrices' })
export class CustomPrice extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  lawyer_id: Types.ObjectId;

  @Prop({ enum: ETypeLawyer })
  type: ETypeLawyer;

  @Prop()
  price: number;

  @Prop()
  description: string;
}

export const CustomPriceSchema = createSchema(CustomPrice);
export const CustomPriceModelName = CustomPrice.name;
export const CustomPriceDestination = {
  name: CustomPriceModelName,
  schema: CustomPriceSchema,
};
export type CustomPriceModel = Model<CustomPrice>;
