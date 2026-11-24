import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;

  onModuleInit(): void {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: Number(process.env.SMTP_PORT) || 1025,
      secure: false,
      ignoreTLS: true,
    });
  }

  async sendNotificationEmail(
    to: string,
    subject: string,
    htmlContent: string,
  ): Promise<string> {
    const result = await this.transporter.sendMail({
      from: process.env.MAIL_FROM || '"Season Drop" <no-reply@shop.local>',
      to,
      subject,
      html: htmlContent,
    });

    this.logger.log(
      `Лист успішно передано SMTP для ${to} (Message ID: ${result.messageId})`,
    );
    return result.messageId;
  }

  createDropStartedTemplate(collectionName: string, collectionId: string): string {
    const safeName = this.escapeHtml(collectionName);
    const safeId = this.escapeHtml(collectionId);

    return `<!doctype html>
<html lang="uk">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Нова колекція вже доступна</title></head>
<body style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial,sans-serif;color:#202124">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:auto;background:#fff;border-radius:14px;overflow:hidden">
<tr><td style="padding:30px;background:#202124;color:#fff;text-align:center">
<div style="font-size:13px;letter-spacing:3px;text-transform:uppercase">SEASON DROP</div>
<h1 style="margin:16px 0 4px;font-size:28px">Колекція вже тут</h1>
<p style="margin:0;color:#d1d5db">Новий сезон починається зараз</p>
</td></tr>
<tr><td style="padding:32px">
<p style="font-size:16px;line-height:1.6">Вітаємо!</p>
<p style="font-size:16px;line-height:1.6">Продаж нової сезонної колекції <strong>${safeName}</strong> розпочато. Перегляньте новинки та оберіть речі, які доповнять ваш стиль.</p>
<table role="presentation" width="100%" style="background:#f8f8f8;border-radius:8px;padding:16px">
<tr><td style="font-size:13px;color:#6b7280">Ідентифікатор колекції</td><td align="right" style="font-weight:bold">${safeId}</td></tr>
<tr><td style="font-size:13px;color:#6b7280;padding-top:10px">Статус</td><td align="right" style="font-weight:bold;color:#16803c;padding-top:10px">Продаж розпочато</td></tr>
</table>
<p style="text-align:center;margin:28px 0">
<a href="http://localhost:3000/client.html" style="display:inline-block;padding:14px 26px;background:#202124;color:#fff;text-decoration:none;border-radius:7px;font-weight:bold">Переглянути повідомлення</a>
</p>
<p style="font-size:12px;line-height:1.5;color:#6b7280">Це автоматичне повідомлення інтернет-магазину одягу та взуття. Будь ласка, не відповідайте на цей лист.</p>
</td></tr>
<tr><td style="padding:18px;text-align:center;background:#f8f8f8;color:#9ca3af;font-size:12px">© ${new Date().getFullYear()} Season Drop</td></tr>
</table></body></html>`;
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (char) => {
      const entities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      };
      return entities[char];
    });
  }
}
