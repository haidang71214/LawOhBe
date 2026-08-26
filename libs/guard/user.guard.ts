import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from "cache-manager";
import { JwtService } from "@nestjs/jwt";
import { KeyService } from "src/key/key.service";
import { Observable } from "rxjs";
import { MetadataKeys } from "libs/constant";
import * as crypto from 'crypto';
import { getAccessToken, setUserData } from "libs/utils/request.until";
import { getProcessId } from "libs/utils/string.until";
@Injectable()
// tạo cái guard để bọc.
export class UserGuard implements CanActivate {
  private readonly logger = new Logger(UserGuard.name);
  constructor(
    private readonly reflector: Reflector,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly jwtService: JwtService,
    private readonly keyService: KeyService,
  ) {}
  canActivate(
    ctx: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const authOption = this.reflector.get<{ secured: boolean }>(
      MetadataKeys.SECURED,
      ctx.getHandler(),
    );
    const request = ctx.switchToHttp().getRequest();
    if (!authOption.secured) {
      return true;
    }
    return this.verifyToken(request);
  }
  // setUserData
  //      const decoded = this.jwtService.verify(token, {
  //   secret: this.keyService.getPublicKey(),
  // });
  private async verifyToken(request: any): Promise<boolean> {
    try {
      const token = getAccessToken(request);
      const processId = request[MetadataKeys.PROCESS_ID] || getProcessId();
      const cacheKey = this.generateTokenCaceKey(token);

      const cacheData = await this.cacheManager.get<any>(cacheKey); // quan trọng là bước này
      if (cacheData) {
        setUserData(request, cacheData);
        return true;
      }
      // gửi token về -> lấy user data và nhét vô
      const response = await this.jwtService.verify(token,{
         secret: this.keyService.getPublicKey()
      })
      
      const { data: result } = response;
      if (!result?.valid) {
        throw new UnauthorizedException('token invalid');
      }

      console.log("log xem result có gì",result);
      
      setUserData(request, result);
      await this.cacheManager.set(cacheKey, result); // và bước này

      return true;
    } catch (error: any) {
      this.logger.error(`Token verification failed: ${error.message}`);
      throw error instanceof UnauthorizedException
        ? error
        : new ForbiddenException(error.message);
    }
  }
// cache token
  generateTokenCaceKey = (token: string) => {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    return `user-hash:${hash}`;
  };
}