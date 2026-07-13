import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MetadataKeys } from 'libs/constant';
import { ResponseDto } from 'libs/interfaces/getway/response.interface';
import { getProcessId } from 'libs/utils/string.until';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const startTime = (request as any)?.[MetadataKeys.START_TIME] || Date.now();
    const processId =
      (request as any)?.[MetadataKeys.PROCESS_ID] ||
      (request?.headers?.['x-request-id'] as string) ||
      getProcessId();
    const durationMs = Date.now() - startTime;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const resObj = exceptionResponse as Record<string, any>;
        if (Array.isArray(resObj.message)) {
          message = resObj.message.join('; ');
        } else if (resObj.message) {
          message = resObj.message;
        } else if (resObj.error) {
          message = resObj.error;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `[${processId}] Unhandled Error: ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.error(`[${processId}] Unknown Exception:`, exception);
    }

    const responseBody = ResponseDto.error(
      message,
      status,
      null,
      `${durationMs} ms`,
      processId,
    );

    response.status(status).json(responseBody);
  }
}
