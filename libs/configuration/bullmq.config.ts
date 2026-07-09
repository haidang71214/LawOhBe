import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class BullMqConfiguration {
  @IsString()
  @IsNotEmpty()
  HOST!: string;

  @IsNumber()
  @IsNotEmpty()
  PORT!: number;

  @IsString()
  @IsOptional()
  PASSWORD?: string;

  constructor(data?: Partial<BullMqConfiguration>) {
    this.HOST = data?.HOST || process.env['REDIS_HOST'] || 'localhost';
    this.PORT = data?.PORT || Number(process.env['REDIS_PORT']) || 6379;
    this.PASSWORD =
      data?.PASSWORD || process.env['REDIS_PASSWORD'] || undefined;
  }
}

/**
 * BullMQ Global Connection Provider
 */
export const BullMqProvider = BullModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const host =
      configService.get<string>('REDIS_SERV.HOST') ||
      process.env['REDIS_HOST'] ||
      'localhost';
    const port =
      configService.get<number>('REDIS_SERV.PORT') ||
      Number(process.env['REDIS_PORT']) ||
      6379;
    const password =
      configService.get<string>('REDIS_SERV.PASSWORD') ||
      process.env['REDIS_PASSWORD'] ||
      undefined;

    return {
      connection: {
        host,
        port,
        password,
        maxRetriesPerRequest: null, // Required by BullMQ
      },
    };
  },
});
