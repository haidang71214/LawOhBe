import { Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Connection } from 'mongoose';
// Mongo configuration class
export class MongoConfiguration {
  @IsString()
  @IsNotEmpty()
  URL: string;
  @IsString()
  @IsNotEmpty()
  DB_NAME: string;
  @IsNumber()
  @IsOptional()
  POOL_SIZE: number;
  @IsNumber()
  @IsOptional()
  CONNECT_TIMEOUT_MS: number;
  @IsNumber()
  @IsOptional()
  SOCKET_TIMEOUT_MS: number;
  constructor(data?: Partial<MongoConfiguration>) {
    this.URL = data?.URL || process.env['MONGO_URL'] || '';
    this.DB_NAME = data?.DB_NAME || process.env['MONGO_DB_NAME'] || '';
    this.POOL_SIZE =
      data?.POOL_SIZE || Number(process.env['MONGO_POOL_SIZE'] || 10);
    this.CONNECT_TIMEOUT_MS =
      data?.CONNECT_TIMEOUT_MS ||
      Number(process.env['MONGO_CONNECT_TIMEOUT_MS'] || 10000);
    this.SOCKET_TIMEOUT_MS =
      data?.SOCKET_TIMEOUT_MS ||
      Number(process.env['MONGO_SOCKET_TIMEOUT_MS'] || 10000);
  }
}
// MongoDB connection provider
export const MongoProvider = MongooseModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    uri: configService.get<string>('MONGO_CONFIG.URL'),
    dbName: configService.get<string>('MONGO_CONFIG.DB_NAME'),
    maxPoolSize: configService.get<number>('MONGO_CONFIG.POOL_SIZE'),
    connectTimeoutMS: configService.get<number>(
      'MONGO_CONFIG.CONNECT_TIMEOUT_MS',
    ),
    socketTimeoutMS: configService.get<number>(
      'MONGO_CONFIG.SOCKET_TIMEOUT_MS',
    ),
    onConnectionCreate: (connection: Connection) => {
      Logger.log('MongoDB connected successfully!', 'MongoProvider');
    },
  }),
});
