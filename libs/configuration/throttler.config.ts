import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';

export const ThrottlerProvider = ThrottlerModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService): ThrottlerModuleOptions => {
    return {
      throttlers: [
        {
          ttl: Number(config.get<number>('THROTTLE_TTL', 60000)),
          limit: Number(config.get<number>('THROTTLE_LIMIT', 20)),
        },
      ],
      errorMessage: 'Too many request,plese try again',
      storage: new ThrottlerStorageRedisService({
        host:
          config.get<string>('REDIS_SERV.HOST') ||
          config.get<string>('REDIS_HOST') ||
          'localhost',
        port:
          config.get<number>('REDIS_SERV.PORT') ||
          config.get<number>('REDIS_PORT') ||
          6379,
      }),
    };
  },
});
