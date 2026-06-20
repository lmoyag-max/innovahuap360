import { randomBytes, createHash } from 'node:crypto';

/** Genera un token opaco de un solo uso (refresh / reset de contraseña). */
export function generateOpaqueToken(): string {
  return randomBytes(32).toString('hex');
}

/** Solo se persiste el hash del token en la base de datos, nunca el valor crudo. */
export function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}
