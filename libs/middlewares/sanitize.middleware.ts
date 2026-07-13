import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// Block NoSQL injection by stripping keys starting with $ or containing .
export function sanitizeNoSql(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeNoSql(item));
  }

  const cleanObj: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }
    cleanObj[key] = sanitizeNoSql(obj[key]);
  }
  return cleanObj;
}

@Injectable()
export class SanitizeMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // In-place mutation to preserve Multer and Express references
    if (
      req.body &&
      typeof req.body === 'object' &&
      Object.keys(req.body).length > 0
    ) {
      for (const key of Object.keys(req.body)) {
        if (key.startsWith('$') || key.includes('.')) {
          delete (req.body as any)[key];
        } else {
          (req.body as any)[key] = sanitizeNoSql((req.body as any)[key]);
        }
      }
    }

    if (
      req.query &&
      typeof req.query === 'object' &&
      Object.keys(req.query).length > 0
    ) {
      for (const key of Object.keys(req.query)) {
        if (key.startsWith('$') || key.includes('.')) {
          delete (req.query as any)[key];
        }
      }
    }

    if (
      req.params &&
      typeof req.params === 'object' &&
      Object.keys(req.params).length > 0
    ) {
      for (const key of Object.keys(req.params)) {
        if (key.startsWith('$') || key.includes('.')) {
          delete (req.params as any)[key];
        }
      }
    }

    next();
  }
}
