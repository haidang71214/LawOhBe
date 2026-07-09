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

  // Soft delete support fields
  @Prop({ type: Boolean, default: false, index: true })
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

  // Soft delete auto-filter pre-hooks
  const queryMethods = [
    'find',
    'findOne',
    'findOneAndUpdate',
    'countDocuments',
  ];
  queryMethods.forEach((method) => {
    schema.pre(method as any, function (this: any) {
      const query = this.getQuery();
      if (query.isDeleted === undefined) {
        this.where({ isDeleted: { $ne: true } });
      }
    });
  });

  return schema;
};
