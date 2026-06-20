import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { AppConfig } from '../config/configuration';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor(private readonly config: ConfigService<AppConfig, true>) {
    const mail = config.get('mail', { infer: true });
    this.from = mail.from;
    this.transporter = nodemailer.createTransport({
      host: mail.host,
      port: mail.port,
      secure: mail.secure,
      auth: mail.user ? { user: mail.user, pass: mail.pass } : undefined,
    });
  }

  async sendPasswordReset(to: string, fullName: string, resetUrl: string): Promise<void> {
    const html = `
      <div style="font-family: 'Hanken Grotesk', Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color:#ed1d25;">InnovaHUAP 360</h2>
        <p>Hola ${fullName},</p>
        <p>Recibimos una solicitud para restablecer tu contraseña. Si no fuiste tú, ignora este correo.</p>
        <p>
          <a href="${resetUrl}" style="background:#ed1d25;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">
            Restablecer contraseña
          </a>
        </p>
        <p>Este enlace es válido por 30 minutos y solo puede usarse una vez.</p>
        <p style="color:#888;font-size:12px;">Comité de Innovación · HUAP · Posta Central</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject: 'InnovaHUAP 360 — Restablecimiento de contraseña',
        html,
      });
    } catch (error) {
      this.logger.error(`No se pudo enviar el correo de recuperación a ${to}`, error as Error);
      throw error;
    }
  }
}
