// cấu hình kết nối database
import { MongooseModuleOptions } from '@nestjs/mongoose';

export const databaseConfig: MongooseModuleOptions = {
  uri: process.env.MONGODB_URI,
};

// Re-export toàn bộ schemas, enums, destinations, model names và model types
export * from '../../libs/schemas';
