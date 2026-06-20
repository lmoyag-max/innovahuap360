import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as nodemailer from 'nodemailer';
import * as Handlebars from 'handlebars';
import type { AppConfig } from '../config/configuration';

export interface MailPublicConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  from: string;
  fromName: string;
  configured: boolean;
}

export interface IdeaCreatedVars {
  proponentName: string;
  title: string;
  folio: string;
  unitName: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly host: string;
  private readonly port: number;
  private readonly secure: boolean;
  private readonly user: string;
  private readonly from: string;
  private readonly fromName: string;
  private readonly frontendUrl: string;
  private readonly templates = new Map<string, Handlebars.TemplateDelegate>();

  constructor(private readonly config: ConfigService<AppConfig, true>) {
    const mail = config.get('mail', { infer: true });
    this.host = mail.host;
    this.port = mail.port;
    this.secure = mail.secure;
    this.user = mail.user;
    this.from = mail.from;
    this.fromName = mail.fromName;
    this.frontendUrl = config.get('frontendUrl', { infer: true });

    this.transporter = nodemailer.createTransport({
      host: mail.host,
      port: mail.port,
      secure: mail.secure,
      auth: mail.user ? { user: mail.user, pass: mail.pass } : undefined,
    });

    this.validateConfig();
  }

  /** No interrumpe el arranque del backend: el correo es un subsistema no
   *  crítico (las notificaciones nunca deben tumbar auth/ideas/etc.), pero
   *  deja constancia clara en logs si falta algo en producción. */
  private validateConfig(): void {
    if (!this.host || !this.port) {
      this.logger.warn('SMTP_HOST/SMTP_PORT no están configurados — el envío de correo fallará.');
      return;
    }
    const isProd = this.config.get('nodeEnv', { infer: true }) === 'production';
    if (isProd && (!this.user || !this.from)) {
      this.logger.error('Configuración SMTP incompleta en producción: revisa SMTP_USER y SMTP_FROM en backend/.env.');
    }
  }

  private loadTemplate(name: string): Handlebars.TemplateDelegate {
    let tpl = this.templates.get(name);
    if (!tpl) {
      const filePath = path.join(__dirname, 'templates', `${name}.hbs`);
      const source = fs.readFileSync(filePath, 'utf8');
      tpl = Handlebars.compile(source);
      this.templates.set(name, tpl);
    }
    return tpl;
  }

  private render(name: string, vars: object): string {
    return this.loadTemplate(name)(vars);
  }

  /** Escapa texto provisto por usuarios antes de insertarlo en HTML crudo
   *  (p. ej. comentarios libres) — evita inyección de marcado en el correo. */
  static escapeHtml(value: string): string {
    return Handlebars.escapeExpression(value);
  }

  /** Primitiva de bajo nivel: envía y deja que el error se propague. Útil
   *  para /mail/test, donde el llamador necesita saber si falló. */
  async sendMail(to: string | string[], subject: string, html: string): Promise<void> {
    const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
    if (recipients.length === 0) return;
    try {
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.from}>`,
        to: recipients,
        subject,
        html,
      });
    } catch (error) {
      this.logger.error(`No se pudo enviar el correo "${subject}" a ${recipients.join(', ')}`, error as Error);
      throw error;
    }
  }

  /** Envío "best effort": nunca debe bloquear el flujo de negocio que lo
   *  dispara (login, recuperación, triage de ideas, etc.). */
  private async safeSend(to: string | string[], subject: string, html: string, context: string): Promise<void> {
    try {
      await this.sendMail(to, subject, html);
    } catch (error) {
      this.logger.error(`Envío no bloqueante fallido (${context})`, error as Error);
    }
  }

  async sendForgotPasswordEmail(to: string, fullName: string, resetUrl: string): Promise<void> {
    const html = this.render('forgot-password', { fullName, resetUrl });
    await this.safeSend(to, 'InnovaHUAP 360 — Restablecimiento de contraseña', html, 'forgot-password');
  }

  async sendPasswordResetSuccessEmail(to: string, fullName: string): Promise<void> {
    const html = this.render('password-reset-success', { fullName, loginUrl: `${this.frontendUrl}/login` });
    await this.safeSend(to, 'InnovaHUAP 360 — Tu contraseña fue actualizada', html, 'password-reset-success');
  }

  async sendIdeaCreatedApplicantEmail(to: string, vars: IdeaCreatedVars): Promise<void> {
    const html = this.render('idea-created-applicant', vars);
    await this.safeSend(to, 'InnovaHUAP 360 — Recibimos tu idea', html, 'idea-created-applicant');
  }

  async sendIdeaCreatedCommitteeEmail(to: string[], vars: IdeaCreatedVars & { ideasUrl: string }): Promise<void> {
    const html = this.render('idea-created-committee', vars);
    await this.safeSend(to, `Nueva idea recibida: ${vars.title}`, html, 'idea-created-committee');
  }

  async sendIdeaStatusChangedEmail(
    to: string,
    vars: { proponentName: string; title: string; statusLabel: string; note?: string },
  ): Promise<void> {
    const html = this.render('idea-status-change', vars);
    await this.safeSend(to, `InnovaHUAP 360 — Tu idea pasó a "${vars.statusLabel}"`, html, 'idea-status-change');
  }

  async sendGenericNotificationEmail(to: string | string[], subject: string, title: string, bodyHtml: string): Promise<void> {
    const html = this.render('generic-notification', { title, bodyHtml });
    await this.safeSend(to, subject, html, 'generic-notification');
  }

  async testSmtpConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      await this.transporter.verify();
      return { ok: true, message: 'Conexión y autenticación SMTP correctas.' };
    } catch (error) {
      this.logger.error('Fallo la verificación de conexión SMTP', error as Error);
      const message = error instanceof Error ? error.message : 'Error desconocido al verificar SMTP';
      return { ok: false, message };
    }
  }

  /** Para el panel de administración — nunca incluye SMTP_PASS. */
  getPublicConfig(): MailPublicConfig {
    return {
      host: this.host,
      port: this.port,
      secure: this.secure,
      user: this.user,
      from: this.from,
      fromName: this.fromName,
      configured: Boolean(this.host && this.port),
    };
  }
}
