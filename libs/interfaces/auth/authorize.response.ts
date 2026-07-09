import { JwtPayload } from 'jsonwebtoken';
import { User } from 'libs/schemas';
import { USER_ROLE } from 'libs/constant';

// AuthorizedMetadata represents an active user session
// This metadata is stored in memory cache to avoid unnecessary database queries
export class AuthorizedMetadata {
  userId!: string;
  user?: User;
  jwt?: JwtPayload;
  role!: USER_ROLE;

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
