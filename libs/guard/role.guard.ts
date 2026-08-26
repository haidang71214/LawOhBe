import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MetadataKeys, USER_ROLE } from 'libs/constant';
import { RoleDecorator } from 'libs/decorators/role.decorator';
import { AuthorizeResponse } from 'libs/interfaces/auth/authorize.response';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get(
      RoleDecorator,
      context.getHandler(),
    );
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userData = request[MetadataKeys.USER_DATA] as AuthorizeResponse;
    const userRole = userData?.metadata?.role;

    const rolesArray = Array.isArray(requiredRoles)
      ? requiredRoles
      : [requiredRoles];

    const isValid = rolesArray.includes(userRole);

    if (!isValid) {
      throw new ForbiddenException('Role permission denied');
    }

    return isValid;
  }
}
