import { Prop, Schema } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseSchema, createSchema } from './base.schema/base.schema';

@Schema({
  timestamps: true,
  collection: 'learn_packages',
})
export class LearnPackage extends BaseSchema {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop({ default: 'none', enum: ['none', 'standard', 'gold', 'deluxe'] })
  type: string;

  @Prop()
  description: string;

  @Prop()
  learn_start: Date;

  @Prop()
  learn_end: Date;

  @Prop({ default: true })
  is_active: boolean;
}

export const LearnPackageSchema = createSchema(LearnPackage);
export const LearnPackageModelName = LearnPackage.name;
export const LearnPackageDestination = {
  name: LearnPackageModelName,
  schema: LearnPackageSchema,
};
export type LearnPackageModel = Model<LearnPackage>;
