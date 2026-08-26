import { Prop, Schema } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseSchema, createSchema } from './base.schema/base.schema';
import { VideoLawCategory } from './enums';

// làm cái video
@Schema({ timestamps: true, collection: 'Videos' })
export class Videos extends BaseSchema {
  @Prop({
    type: String,
    enum: Object.values(VideoLawCategory),
  })
  categories: string;

  // người đăng
  @Prop({ type: Types.ObjectId, ref: 'User' })
  user_id: Types.ObjectId;

  @Prop()
  // video_url
  video_url: string;

  @Prop()
  thumnail_url: string;

  @Prop({ default: 0, max: 5, min: 0 })
  star: number;

  @Prop()
  description: string;

  @Prop({ required: true, default: false })
  accept: boolean;
}

export const VideoSchema = createSchema(Videos);
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
