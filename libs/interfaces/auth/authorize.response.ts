
import { JwtPayload } from 'jsonwebtoken';
import { User } from 'libs/schemas';
import { USER_ROLE } from 'libs/constant';

// AuthorizedMetadata đại diện cho 1 phiên đăng nhập
// metadata này sẽ được lưu trong cache memory để tránh gọi database
export class AuthorizedMetadata {
  userId: string | undefined;
  user: User | undefined;
  jwt: JwtPayload | undefined;
  role: USER_ROLE
  constructor(payload?: Partial<AuthorizedMetadata>) {
    Object.assign(this, payload);
  }
}

export class AuthorizeResponse {
  valid = false;
  metadata = new AuthorizedMetadata();

  constructor(payload?: Partial<AuthorizeResponse>) {
    Object.assign(this, payload);
  }
}
