import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createKeyv } from '@keyv/redis';

export class RedisConfiguration {
  @IsString()
  @IsNotEmpty()
  HOST!: string;

  @IsNumber()
  @IsNotEmpty()
  PORT!: number;

  @IsNumber()
  @IsOptional()
  TTL?: number;

  constructor(data?: Partial<RedisConfiguration>) {
    this.HOST = data?.HOST || process.env['REDIS_HOST'] || 'localhost';
    this.PORT = data?.PORT || Number(process.env['REDIS_PORT']) || 6379;
    this.TTL = data?.TTL || Number(process.env['TIME_TO_LIVE']) || 3600;
  }
}

export const RedisProvider = CacheModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const host = configService.get<string>('REDIS_SERV.HOST') || 'localhost';
    const port = configService.get<number>('REDIS_SERV.PORT') || 6379;
    const ttl = configService.get<number>('REDIS_SERV.TTL') || 3600;
    return {
      stores: [createKeyv(`redis://${host}:${port}`)],
      ttl,
    };
  },
});
