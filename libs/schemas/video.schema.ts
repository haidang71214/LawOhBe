import { Prop, Schema } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseSchema, createSchema } from './base.schema/base.schema';
import { VideoLawCategory } from './enums';

@Schema({ timestamps: true, collection: 'Videos' })
export class Videos extends BaseSchema {
  @Prop({
    type: String,
    enum: Object.values(VideoLawCategory),
    index: true,
  })
  categories: string;

  // Author reference
  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  user_id: Types.ObjectId;

  @Prop()
  video_url: string;

  @Prop()
  thumnail_url: string;

  @Prop({ default: 0, max: 5, min: 0 })
  star: number;

  @Prop()
  description: string;

  @Prop({ required: true, default: false, index: true })
  accept: boolean;
}

export const VideoSchema = createSchema(Videos);
VideoSchema.index({ accept: 1, categories: 1 });
VideoSchema.index({ user_id: 1, accept: 1 });

export const VideosSchema = VideoSchema;
export const VideoModelName = Videos.name;
export const VideosModelName = Videos.name;
export const VideoDestination = {
  name: VideoModelName,
  schema: VideoSchema,
};
export const VideosDestination = VideoDestination;
export type VideoModel = Model<Videos>;
export type VideosModel = Model<Videos>;
