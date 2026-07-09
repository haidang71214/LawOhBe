import { Logger } from '@nestjs/common';
import { IsBoolean, IsOptional, IsString, validateSync } from 'class-validator';

export class BaseConfiguration {
  @IsString()
  NODE_ENV: string;

  @IsBoolean()
  IS_DEV: boolean;

  @IsString()
  @IsOptional()
  GLOBAL_PREFIX: string;

  constructor() {
    this.NODE_ENV = process.env['NODE_ENV'] || 'development';
    this.IS_DEV = this.NODE_ENV === 'development';
    this.GLOBAL_PREFIX = process.env['GLOBAL_PREFIX'] || 'api/v1';
  }

  validate() {
    const errors = validateSync(this);
    if (errors.length > 0) {
      Logger.error('Configuration validation failed!');
      const formatErrors = (validationErrors: any[]): any[] => {
        return validationErrors.map((err) => ({
          property: err.property,
          constraints: err.constraints,
          children:
            err.children && err.children.length > 0
              ? formatErrors(err.children)
              : undefined,
        }));
      };

      const formatted = formatErrors(errors);
      throw new Error('Configuration Error: ' + JSON.stringify(formatted));
    }
  }
}
