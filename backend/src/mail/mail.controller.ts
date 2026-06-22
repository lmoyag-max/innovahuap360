import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsEmail } from 'class-validator';
import type { Request } from 'express';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { RequireModule } from '../common/decorators/module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.interface';
import { AuditService } from '../audit/audit.service';
import { MailService } from './mail.service';

class TestMailDto {
  @IsEmail()
  to!: string;
}

@ApiTags('mail')
@Controller('mail')
export class MailController {
  constructor(
    private readonly mailService: MailService,
    private readonly auditService: AuditService,
  ) {}

  @Get('health')
  @RequirePermissions('settings.manage')
  @RequireModule('mail')
  async health() {
    const config = this.mailService.getPublicConfig();
    const connection = await this.mailService.testSmtpConnection();
    return { ...config, connection: connection.ok ? 'ok' : 'error', message: connection.message, checkedAt: new Date().toISOString() };
  }

  @Post('test')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('settings.manage')
  @RequireModule('mail')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  async test(@Body() dto: TestMailDto, @CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    await this.mailService.sendMail(
      dto.to,
      'InnovaHUAP 360 — Correo de prueba',
      this.testEmailHtml(),
    );
    await this.auditService.log({
      userId: user.sub,
      action: 'mail.test_sent',
      metadata: { to: dto.to },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  private testEmailHtml(): string {
    return `
      <div style="font-family: 'Hanken Grotesk', Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color:#ed1d25;margin:0 0 4px;">InnovaHUAP 360</h2>
        <p>Este es un correo de prueba enviado desde el panel de administración.</p>
        <p>Si lo recibiste, la configuración SMTP está funcionando correctamente.</p>
        <p style="color:#888;font-size:12px;">Comité de Innovación · HUAP · Posta Central</p>
      </div>
    `;
  }
}
