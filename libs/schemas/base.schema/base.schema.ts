import { Type } from '@nestjs/common';
import { Prop, SchemaFactory, Virtual } from '@nestjs/mongoose';
import { Schema, Types } from 'mongoose';

export class BaseSchema {
  _id!: Types.ObjectId;

  @Virtual({
    get: function (this: any) {
      return this._id?.toString();
    },
  })
  id!: string;

  @Prop({ type: Date, default: () => new Date() })
  createdAt!: Date;

  @Prop({ type: Date, default: () => new Date() })
  updatedAt!: Date;

  // Trường hỗ trợ xóa mềm (soft delete)
  @Prop({ type: Boolean, default: false })
  isDeleted?: boolean;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export const createSchema = <TClass = any>(target: Type<TClass>): Schema => {
  const schema = SchemaFactory.createForClass(target);
  schema.set('toJSON', {
    virtuals: true,
  });
  schema.set('toObject', {
    virtuals: true,
  });
  schema.set('versionKey', false);
  schema.set('timestamps', true);

  return schema;
};
