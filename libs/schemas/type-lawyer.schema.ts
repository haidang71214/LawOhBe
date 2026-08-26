import { Prop, Schema } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseSchema, createSchema } from './base.schema/base.schema';
import { ETypeLawyer } from './enums';

@Schema({
  timestamps: true,
  collection: 'type_lawyers',
})
// cái này tự tạo sau đó thì nhét hết vô 1 thằng lawyer những cái type này
export class TypeLawyer extends BaseSchema {
  @Prop({
    type: [String],
    required: true,
    enum: ETypeLawyer,
  })
  type: ETypeLawyer[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  lawyer_id: Types.ObjectId;
}

export const TypeLawyerSchema = createSchema(TypeLawyer);
export const TypeLawyerModelName = TypeLawyer.name;
export const TypeLawyerDestination = {
  name: TypeLawyerModelName,
  schema: TypeLawyerSchema,
};
export type TypeLawyerModel = Model<TypeLawyer>;
