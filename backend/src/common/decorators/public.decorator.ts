import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marca una ruta como accesible sin JWT (el guard global de auth la deja pasar). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
