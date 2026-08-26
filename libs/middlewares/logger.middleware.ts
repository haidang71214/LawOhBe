import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetadataKeys } from 'libs/constant';
import { getProcessId } from 'libs/utils/string.until';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, originalUrl, body } = req;
    const processId = getProcessId();
    const now = Date.now();
    (req as any)[MetadataKeys.PROCESS_ID] = processId;
    (req as any)[MetadataKeys.START_TIME] = startTime;

    Logger.log(
      `HTTP >> Start process '${processId}' >> path: '${originalUrl}' >> method: '${method}' at '${now}' >> input: ${JSON.stringify(
        body,
      )}`,
    );

    // sao lưu ngữ cảnh gốc và ghi đè
    const originalSend = res.send.bind(res);
    // hàm này sẽ được chạy sau cùng sau khi interceptor, controller , pipe chạy
    res.send = (body: any) => {
      const durationMs = Date.now() - startTime;
      Logger.log(
        `HTTP >> End process '${processId}' >> path: '${originalUrl}' >> method: '${method}' at '${startTime}' >> duration: ${durationMs} ms`,
      );

      return originalSend(body);
    };

    // next này tượng trưng cho các bước tiếp theo như interceptor, controller, pipe
    next();
  }
}
