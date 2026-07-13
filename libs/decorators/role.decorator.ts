import { Reflector } from '@nestjs/core';
import { USER_ROLE } from 'libs/constant';

// Decorator to enforce required user role
export const RoleDecorator = Reflector.createDecorator<USER_ROLE>();
