import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('MAIL_HOST'),
      port: Number(this.config.get('MAIL_PORT') ?? 465),
      secure: String(this.config.get('MAIL_SECURE') ?? 'true') === 'true',
      auth: {
        user: this.config.get<string>('MAIL_USER'),
        pass: this.config.get<string>('MAIL_PASS'),
      },
    });
  }

  private get from(): string {
    return (
      this.config.get<string>('MAIL_FROM') ||
      this.config.get<string>('MAIL_USER') ||
      'no-reply@genzuni.com'
    );
  }

  /** Sends the registration OTP code to the user. Throws if delivery fails. */
  async sendOtp(to: string, code: string | number): Promise<void> {
    await this.transporter.sendMail({
      from: `GenZUni <${this.from}>`,
      to,
      subject: 'کد تأیید ثبت‌نام GenZUni',
      text: `کد تأیید شما: ${code}\nاین کد تا ۱۰ دقیقه معتبر است.`,
      html: this.otpHtml(code),
    });
    this.logger.log(`Registration OTP sent to ${to}`);
  }

  private otpHtml(code: string | number): string {
    return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:24px;background:#f4f6f9;font-family:Tahoma,Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,0.06);">
    <div style="background:linear-gradient(135deg,#ea6a1e,#f59e0b);padding:28px 24px;text-align:center;">
      <span style="font-size:26px;font-weight:800;color:#ffffff;letter-spacing:1px;">GenZUni</span>
    </div>
    <div style="padding:28px 28px 32px;text-align:center;color:#1e1e1e;">
      <h2 style="margin:0 0 8px;font-size:20px;">کد تأیید ثبت‌نام</h2>
      <p style="margin:0 0 22px;color:#6b7280;font-size:14px;">برای تکمیل ثبت‌نام، کد زیر را وارد کنید:</p>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:14px;padding:18px;margin:0 0 18px;">
        <span style="font-size:40px;font-weight:800;letter-spacing:10px;color:#ea6a1e;font-family:'Courier New',monospace;">${code}</span>
      </div>
      <p style="margin:0;color:#9ca3af;font-size:13px;">⏳ این کد تا ۱۰ دقیقه معتبر است.</p>
    </div>
  </div>
</body>
</html>`;
  }
}
