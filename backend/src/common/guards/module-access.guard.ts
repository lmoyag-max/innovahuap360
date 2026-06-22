import { ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CanActivate } from '@nestjs/common';
import { MODULE_KEY } from '../decorators/module.decorator';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.interface';

/**
 * Capa adicional a PermissionsGuard: exige que el rol del usuario tenga
 * habilitado el módulo de navegación de la ruta (independiente de los
 * permisos funcionales). Si la ruta no usa @RequireModule, deja pasar.
 */
@Injectable()
export class ModuleAccessGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string>(MODULE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;
    if (!user) throw new ForbiddenException('No autenticado');

    if (!user.moduleKeys?.includes(required)) {
      throw new ForbiddenException('Este módulo no está habilitado para tu rol');
    }
    return true;
  }
}
