import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class MailConfiguration {
  @IsString()
  @IsOptional()
  MAIL_HOST?: string;

  @IsNumber()
  @IsNotEmpty()
  MAIL_PORT!: number;

  @IsString()
  @IsNotEmpty()
  MAIL_USER!: string;

  @IsString()
  @IsNotEmpty()
  MAIL_PASS!: string;

  @IsString()
  @IsNotEmpty()
  MAIL_SENDER_NAME!: string;

  @IsString()
  @IsNotEmpty()
  MAIL_SENDER_EMAIL!: string;

  constructor(data?: Partial<MailConfiguration>) {
    this.MAIL_HOST =
      data?.MAIL_HOST ||
      process.env['EMAIL_HOST'] ||
      process.env['MAIL_HOST'] ||
      'smtp.gmail.com';
    this.MAIL_PORT =
      data?.MAIL_PORT ||
      (process.env['EMAIL_PORT']
        ? Number(process.env['EMAIL_PORT'])
        : process.env['MAIL_PORT']
          ? Number(process.env['MAIL_PORT'])
          : 587);
    this.MAIL_USER =
      data?.MAIL_USER ||
      process.env['EMAIL_USER'] ||
      process.env['MAIL_USER'] ||
      '';
    this.MAIL_PASS =
      data?.MAIL_PASS ||
      process.env['EMAIL_PASS'] ||
      process.env['MAIL_PASS'] ||
      '';
    this.MAIL_SENDER_NAME =
      data?.MAIL_SENDER_NAME ||
      process.env['EMAIL_SENDER_NAME'] ||
      process.env['MAIL_SENDER_NAME'] ||
      '';
    this.MAIL_SENDER_EMAIL =
      data?.MAIL_SENDER_EMAIL ||
      process.env['EMAIL_SENDER_EMAIL'] ||
      process.env['MAIL_SENDER_EMAIL'] ||
      '';
  }
}
