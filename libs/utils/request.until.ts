import { MetadataKeys } from 'libs/constant';
import { parseToken } from './string.until';
import { AuthorizeResponse } from 'libs/interfaces/auth/authorize.response';

export function getAccessToken(request: any, keepBearer = false): string {
  const token = request.headers?.['authorization'];
  return keepBearer ? token : parseToken(token);
}
export function setUserData(request: any, userData: AuthorizeResponse) {
  request[MetadataKeys.USER_DATA] = userData;
}
