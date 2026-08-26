import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { KeyService } from 'src/key/key.service';


@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly keyService: KeyService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token không hợp lệ hoặc không tồn tại');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = this.jwtService.verify(token, {
        secret: this.keyService.getPublicKey(),
      });
      // ở đây
      request.user = decoded.data;
      return true;
    } catch {
      throw new UnauthorizedException('Token không hợp lệ');
    }
  }
}
