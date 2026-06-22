import { SetMetadata } from '@nestjs/common';

export const MODULE_KEY = 'module';

/** Exige que el rol del usuario autenticado tenga habilitado este módulo de navegación. */
export const RequireModule = (key: string) => SetMetadata(MODULE_KEY, key);
