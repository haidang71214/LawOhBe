import { Reflector } from "@nestjs/core";
import { USER_ROLE } from "libs/constant";

// ép nó chọn role.
export const RoleDecorator = Reflector.createDecorator<USER_ROLE>();