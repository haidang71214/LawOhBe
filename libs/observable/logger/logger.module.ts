import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { TransportTargetOptions } from 'pino';
import { trace, context } from '@opentelemetry/api';

@Module({})
export class LoggerModule {
  static forRoot(appName: string): DynamicModule {
    return {
      module: LoggerModule,
      imports: [
        PinoLoggerModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            const targets: TransportTargetOptions[] = [];

            // 1. Pretty Print for non-production (Dev)
            if (configService.get('NODE_ENV') !== 'production') {
              targets.push({
                target: 'pino-pretty',
                options: {
                  singleLine: true,
                  translateTime: 'SYS:standard',
                  colorize: true,
                },
              });
            }

            // 2. Loki Push (Enable via env var)
            const enableLoki =
              configService.get('LOKI.ENABLE_LOKI_PUSH') ||
              configService.get('LOKI_CONFIG.ENABLE_LOKI_PUSH') ||
              process.env['ENABLE_LOKI_PUSH'] === 'true';

            const lokiHost =
              configService.get('LOKI.HOST') ||
              configService.get('LOKI_CONFIG.HOST') ||
              process.env['LOKI_HOST'] ||
              'http://localhost:3100';

            if (enableLoki) {
              targets.push({
                target: 'pino-loki',
                options: {
                  batching: true,
                  interval: 5,
                  host: lokiHost,
                  labels: { application: appName },
                },
              });
            }

            return {
              pinoHttp: {
                transport:
                  targets.length > 0
                    ? {
                        targets,
                      }
                    : undefined,
                autoLogging: false,
                serializers: {
                  req: () => undefined,
                  res: () => undefined,
                },
                mixin() {
                  const span = trace.getSpan(context.active());
                  if (span) {
                    const { traceId, spanId, traceFlags } = span.spanContext();
                    return {
                      trace_id: traceId,
                      span_id: spanId,
                      trace_flags: traceFlags.toString(16).padStart(2, '0'),
                    };
                  }
                  return {};
                },
              },
            };
          },
        }),
      ],
      exports: [PinoLoggerModule],
    };
  }
}
export { Logger } from 'nestjs-pino';
