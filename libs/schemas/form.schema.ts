import { Prop, Schema } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseSchema, createSchema } from './base.schema/base.schema';
import { ETypeLawyer } from './enums';

@Schema({ timestamps: true, collection: 'forms' })
export class Form extends BaseSchema {
  @Prop()
  uri_secure: string;

  @Prop()
  mainContent: string;

  @Prop()
  description: string;

  @Prop({ enum: ETypeLawyer })
  type: ETypeLawyer;
}

export const FormSchema = createSchema(Form);
export const FormModelName = Form.name;
export const FormDestination = {
  name: FormModelName,
  schema: FormSchema,
};
export type FormModel = Model<Form>;
