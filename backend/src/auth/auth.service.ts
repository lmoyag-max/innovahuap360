import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import type { AppConfig } from '../config/configuration';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { generateOpaqueToken, hashToken } from './token.utils';
import type { AuthenticatedUser } from './types/authenticated-user.interface';

export interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

type UserWithRole = NonNullable<Awaited<ReturnType<UsersService['findByEmailWithAuth']>>>;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<AppConfig, true>,
    private readonly auditService: AuditService,
    private readonly mailService: MailService,
  ) {}

  private buildPermissions(user: UserWithRole): string[] {
    return user.role.permissions.map((rp) => rp.permission.key);
  }

  private signAccessToken(user: UserWithRole): string {
    const payload: AuthenticatedUser = {
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      roleKey: user.role.key,
      permissions: this.buildPermissions(user),
    };
    const jwt = this.config.get('jwt', { infer: true });
    return this.jwtService.sign(payload, { secret: jwt.accessSecret, expiresIn: jwt.accessTtl });
  }

  private async issueRefreshToken(userId: string, meta: RequestMeta): Promise<string> {
    const raw = generateOpaqueToken();
    const jwt = this.config.get('jwt', { infer: true });
    const expiresAt = new Date(Date.now() + jwt.refreshTtlDays * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(raw),
        userId,
        expiresAt,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    });
    return raw;
  }

  private safeUser(user: UserWithRole) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      initials: user.initials,
      position: user.position,
      mustChangePass: user.mustChangePass,
      role: { key: user.role.key, name: user.role.name },
      permissions: this.buildPermissions(user),
    };
  }

  /** Perfil completo para /auth/me — misma forma que devuelven login/refresh
   *  (id, initials, role anidado, etc.), nunca el payload crudo del JWT. */
  async getProfile(userId: string) {
    const user = await this.usersService.findByIdWithAuth(userId);
    if (!user || !user.isActive) throw new UnauthorizedException('Usuario no disponible');
    return this.safeUser(user);
  }

  async login(email: string, password: string, meta: RequestMeta) {
    const user = await this.usersService.findByEmailWithAuth(email);
    const genericError = 'Credenciales inválidas';

    // Comparación constante: si no existe el usuario, igual se calcula un hash
    // para no filtrar por temporización si el correo existe o no.
    const hashToCompare = user?.passwordHash ?? (await argon2.hash('placeholder-no-existe'));
    const passwordOk = await argon2.verify(hashToCompare, password).catch(() => false);

    if (!user || !user.isActive || !passwordOk) {
      await this.auditService.log({
        action: 'auth.login_failed',
        metadata: { email },
        ip: meta.ip,
        userAgent: meta.userAgent,
      });
      throw new UnauthorizedException(genericError);
    }

    const accessToken = this.signAccessToken(user);
    const refreshToken = await this.issueRefreshToken(user.id, meta);
    await this.usersService.touchLastLogin(user.id);
    await this.auditService.log({
      userId: user.id,
      action: 'auth.login',
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    return { accessToken, refreshToken, user: this.safeUser(user) };
  }

  async refresh(rawToken: string, meta: RequestMeta) {
    const tokenHash = hashToken(rawToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Sesión expirada, vuelve a iniciar sesión');
    }

    const user = await this.usersService.findByIdWithAuth(stored.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario no disponible');
    }

    const newRawToken = generateOpaqueToken();
    const jwt = this.config.get('jwt', { infer: true });
    const expiresAt = new Date(Date.now() + jwt.refreshTtlDays * 24 * 60 * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date(), replacedBy: hashToken(newRawToken) },
      }),
      this.prisma.refreshToken.create({
        data: {
          tokenHash: hashToken(newRawToken),
          userId: user.id,
          expiresAt,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ]);

    const accessToken = this.signAccessToken(user);
    return { accessToken, refreshToken: newRawToken, user: this.safeUser(user) };
  }

  async logout(rawToken: string | undefined) {
    if (!rawToken) return;
    const tokenHash = hashToken(rawToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async forgotPassword(email: string, meta: RequestMeta) {
    const user = await this.usersService.findByEmailWithAuth(email);

    // Respuesta idéntica exista o no el usuario (evita enumeración de correos).
    if (!user || !user.isActive) {
      this.logger.log(`Solicitud de recuperación para correo no registrado: ${email}`);
      return;
    }

    const raw = generateOpaqueToken();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
    await this.prisma.passwordResetToken.create({
      data: { tokenHash: hashToken(raw), userId: user.id, expiresAt },
    });

    const resetUrl = `${this.config.get('frontendUrl', { infer: true })}/restablecer-password/${raw}`;
    await this.mailService.sendForgotPasswordEmail(user.email, user.fullName, resetUrl);

    await this.auditService.log({ userId: user.id, action: 'auth.forgot_password', ip: meta.ip, userAgent: meta.userAgent });
  }

  async resetPassword(rawToken: string, newPassword: string) {
    const tokenHash = hashToken(rawToken);
    const stored = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.usedAt || stored.expiresAt < new Date()) {
      throw new BadRequestException('El enlace de recuperación no es válido o expiró');
    }

    const user = await this.usersService.findByIdWithAuth(stored.userId);
    const passwordHash = await argon2.hash(newPassword);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: stored.userId }, data: { passwordHash, mustChangePass: false } }),
      this.prisma.passwordResetToken.update({ where: { id: stored.id }, data: { usedAt: new Date() } }),
      // Cierra todas las sesiones activas tras un reset de contraseña.
      this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    if (user) await this.mailService.sendPasswordResetSuccessEmail(user.email, user.fullName);
    await this.auditService.log({ userId: stored.userId, action: 'auth.reset_password' });
  }

  async changeOwnPassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.usersService.findByIdWithAuth(userId);
    if (!user) throw new UnauthorizedException();

    const ok = await argon2.verify(user.passwordHash, currentPassword).catch(() => false);
    if (!ok) throw new BadRequestException('La contraseña actual no es correcta');

    const passwordHash = await argon2.hash(newPassword);
    await this.usersService.updateOwnPassword(userId, passwordHash);
    await this.mailService.sendPasswordResetSuccessEmail(user.email, user.fullName);
    await this.auditService.log({ userId, action: 'auth.change_password' });
  }
}
