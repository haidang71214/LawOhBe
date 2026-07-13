import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { JwtService } from '@nestjs/jwt';
import { KeyService } from 'src/shared/key/key.service';
import { Observable } from 'rxjs';
import { MetadataKeys, USER_ROLE } from 'libs/constant';
import * as crypto from 'crypto';
import { getAccessToken, setUserData } from 'libs/utils/request.until';
import {
  AuthorizedMetadata,
  AuthorizeResponse,
} from 'libs/interfaces/auth/authorize.response';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserModelName } from 'libs/schemas';
import { Model } from 'mongoose';

@Injectable()
export class UserGuard implements CanActivate {
  private readonly logger = new Logger(UserGuard.name);

  constructor(
    private readonly reflector: Reflector,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly jwtService: JwtService,
    private readonly keyService: KeyService,
    @InjectModel(UserModelName) private readonly userModel: Model<User>,
  ) {}

  canActivate(
    ctx: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const authOption = this.reflector.get<{ secured: boolean }>(
      MetadataKeys.SECURED,
      ctx.getHandler(),
    );
    const request = ctx.switchToHttp().getRequest();
    if (!authOption?.secured) {
      return true;
    }
    return this.verifyToken(request);
  }

  private async verifyToken(request: any): Promise<boolean> {
    try {
      const token = getAccessToken(request);
      if (!token) {
        throw new UnauthorizedException('Token is missing');
      }

      const cacheKey = this.generateTokenCaceKey(token);

      const cacheData =
        await this.cacheManager.get<AuthorizeResponse>(cacheKey);
      if (cacheData) {
        setUserData(request, cacheData);
        request.user = { userId: cacheData.metadata?.userId };
        return true;
      }

      const decoded: any = await this.jwtService.verify(token, {
        secret: this.keyService.getPublicKey(),
        algorithms: ['RS256'],
      });

      const userId = decoded?.data?.userId || decoded?.userId || decoded?.sub;
      if (!userId) {
        throw new UnauthorizedException('Invalid token: userId missing');
      }

      const user = await this.userModel.findById(userId).lean();
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const authResponse = new AuthorizeResponse({
        valid: true,
        metadata: new AuthorizedMetadata({
          userId: user._id.toString(),
          user: user as any,
          role: user.role as USER_ROLE,
          jwt: decoded,
        }),
      });

      setUserData(request, authResponse);
      request.user = { userId: user._id.toString() };
      await this.cacheManager.set(cacheKey, authResponse);

      return true;
    } catch (error: any) {
      this.logger.error(`Token verification failed: ${error.message}`);
      throw error instanceof UnauthorizedException
        ? error
        : new ForbiddenException(error.message);
    }
  }

  generateTokenCaceKey = (token: string) => {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    return `user-hash:${hash}`;
  };
}
