import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { MetadataKeys } from 'libs/constant';

export const AuthorizerDecorator = (
  options: { secured: boolean } = { secured: true },
) => {
  const setMetadata = SetMetadata(MetadataKeys.SECURED, {
    secured: options.secured,
  });
  if (options.secured) {
    return applyDecorators(ApiBearerAuth(), setMetadata);
  }
  return setMetadata;
};

export const Authorizer = AuthorizerDecorator;
