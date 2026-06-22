import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AppConfig } from '../../config/configuration';
import type { AuthenticatedUser } from '../types/authenticated-user.interface';
import { PrismaService } from '../../prisma/prisma.service';

// Sin esto, un access token firmado sigue siendo válido hasta su expiración
// (15 min) aunque el usuario se desactive/elimine mientras tanto — antes solo
// se revalidaba en /auth/me y en refresh(). La caché corta evita una consulta
// a BD en cada request sin reabrir esa ventana de 15 min.
const ACTIVE_CHECK_CACHE_MS = 10_000;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly activeCache = new Map<string, { isActive: boolean; checkedAt: number }>();

  constructor(
    config: ConfigService<AppConfig, true>,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('jwt', { infer: true }).accessSecret,
    });
  }

  async validate(payload: AuthenticatedUser): Promise<AuthenticatedUser> {
    const cached = this.activeCache.get(payload.sub);
    const now = Date.now();
    let isActive: boolean;

    if (cached && now - cached.checkedAt < ACTIVE_CHECK_CACHE_MS) {
      isActive = cached.isActive;
    } else {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { isActive: true, deletedAt: true },
      });
      isActive = Boolean(user && user.isActive && !user.deletedAt);
      this.activeCache.set(payload.sub, { isActive, checkedAt: now });
    }

    if (!isActive) throw new UnauthorizedException('Usuario no disponible');
    return payload;
  }
}
