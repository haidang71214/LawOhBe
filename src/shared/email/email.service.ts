import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly transporter: Transporter;
  private readonly senderName: string;
  private readonly senderEmail: string;

  constructor(private readonly configService: ConfigService) {
    const host =
      this.configService.get<string>('MAIL.MAIL_HOST') ||
      this.configService.get<string>('MAIL_HOST') ||
      'smtp.gmail.com';
    const port =
      this.configService.get<number>('MAIL.MAIL_PORT') ||
      this.configService.get<number>('MAIL_PORT') ||
      587;
    const user =
      this.configService.get<string>('MAIL.MAIL_USER') ||
      this.configService.get<string>('MAIL_USER') ||
      '';
    const pass =
      this.configService.get<string>('MAIL.MAIL_PASS') ||
      this.configService.get<string>('MAIL_PASS') ||
      '';

    this.senderName =
      this.configService.get<string>('MAIL.MAIL_SENDER_NAME') ||
      this.configService.get<string>('MAIL_SENDER_NAME') ||
      'LAWOH';
    this.senderEmail =
      this.configService.get<string>('MAIL.MAIL_SENDER_EMAIL') ||
      this.configService.get<string>('MAIL_SENDER_EMAIL') ||
      user;

    this.transporter = createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }

  async sendMail(to: string, subject: string, text: string, html?: string) {
    const mailOption = {
      from: `"${this.senderName}" <${this.senderEmail}>`,
      to,
      subject,
      text,
      html,
    };
    try {
      const info = await this.transporter.sendMail(mailOption);
      return info;
    } catch (error: any) {
      Logger.error(
        `Error sending email to ${to}: ${error.message}`,
        'EmailService',
      );
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }
}
