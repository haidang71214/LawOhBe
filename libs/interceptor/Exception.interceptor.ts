import {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { Request, Response } from 'express';
import { MetadataKeys } from 'libs/constant';
import { ResponseDto } from 'libs/interfaces/getway/response.interface';
import { getProcessId } from 'libs/utils/string.until';

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // Bỏ qua interceptor cho endpoint /metrics của Prometheus hoặc /health
    if (request?.url?.includes('/metrics')) {
      return next.handle();
    }

    const processID =
      (request as any)?.[MetadataKeys.PROCESS_ID] ||
      (request?.headers?.['x-request-id'] as string) ||
      getProcessId();

    const startTime = (request as any)?.[MetadataKeys.START_TIME] || Date.now();

    return next.handle().pipe(
      map((data: any) => {
        const durationMs = Date.now() - startTime;
        if (data instanceof ResponseDto) {
          data.processId = processID;
          data.duration = `${durationMs} ms`;
          if (data.statusCode && !response.headersSent) {
            response.status(data.statusCode);
          }
          return data;
        }

        // Wrap non-ResponseDto payloads
        return ResponseDto.success(
          data,
          'Success',
          response.statusCode || HttpStatus.OK,
          `${durationMs} ms`,
          processID,
        );
      }),
    );
  }
}

export const ExceptionInterceptor = ResponseTransformInterceptor;
export type ExceptionInterceptor = ResponseTransformInterceptor;
