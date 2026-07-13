import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const authHeader = req.headers?.authorization;
    if (authHeader) {
      return `auth_${authHeader.slice(-20)}`;
    }
    const ip =
      req.headers?.['x-forwarded-for'] ||
      req.ip ||
      req.socket?.remoteAddress ||
      'unknown_ip';
    return `ip_${Array.isArray(ip) ? ip[0] : ip}`;
  }

  protected async handleRequest(
    requestProps: ThrottlerRequest,
  ): Promise<boolean> {
    const { context } = requestProps;
    const { req } = this.getRequestResponse(context);

    // Nếu là request GET, HEAD, OPTIONS:
    // Đặt hạn mức rộng 1500 requests/phút (~25 requests/giây liên tục)
    // Người dùng cuộn trang, refetch, chuyển tab, reload thoải mái mà không lo bị chặn nhầm,
    // đồng thời vẫn ngăn chặn được các đợt tấn công DDoS/spam dồn dập.
    let customLimit = requestProps.limit;
    if (
      req?.method === 'GET' ||
      req?.method === 'HEAD' ||
      req?.method === 'OPTIONS'
    ) {
      customLimit = 1500;
    }

    return super.handleRequest({
      ...requestProps,
      limit: customLimit,
    });
  }
}
