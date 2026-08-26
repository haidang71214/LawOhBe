import * as jwt from 'jsonwebtoken';

export class TokenHeheControllerService{
  createTokenAsyncKey = (payload: any): string => {
  const privateKey = process.env.PRIVATE_KEY || 'your-private-key';
  return jwt.sign({ data: payload }, privateKey, {
    algorithm: 'RS256',
    expiresIn: '7d', 
  });
};
}