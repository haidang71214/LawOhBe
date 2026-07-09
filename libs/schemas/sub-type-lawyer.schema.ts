import { Prop, Schema } from '@nestjs/mongoose';
import { Model, Schema as MongooseSchema, Types } from 'mongoose';
import { BaseSchema, createSchema } from './base.schema/base.schema';

@Schema({
  timestamps: true,
  collection: 'sub_type_lawyers',
})
export class SubTypeLawyer extends BaseSchema {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'TypeLawyer',
    required: true,
  })
  parentType: Types.ObjectId;

  @Prop({ required: false, type: [String] })
  subType: string;

  @Prop({ required: false })
  name?: string;
}

export const SubTypeLawyerSchema = createSchema(SubTypeLawyer);
export const SubTypeLawyerModelName = SubTypeLawyer.name;
export const SubTypeLawyerDestination = {
  name: SubTypeLawyerModelName,
  schema: SubTypeLawyerSchema,
};
export type SubTypeLawyerModel = Model<SubTypeLawyer>;
