import * as jwt from 'jsonwebtoken';

export class TokenControllerService{
  createTokenAsyncKey = (payload: any): string => {
  const privateKey = process.env.PRIVATE_KEY || 'Dang-deptrai-vcl';
  return jwt.sign({ data: payload }, privateKey, {
    algorithm: 'RS256',
    expiresIn: '7d', 
  });
};
}