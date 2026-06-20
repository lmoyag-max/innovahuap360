# Arquitectura

## Vista general

```
                         ┌──────────────────────┐
   Usuario (navegador) ──▶│   Nginx (puerto 80)  │  ← punto de entrada único
                         └───────────┬──────────┘
                       /api/*        │        /*
                          ▼                     ▼
                ┌──────────────────┐   ┌──────────────────┐
                │  backend (3001)  │   │ frontend (80)    │
                │  NestJS API      │   │ Nginx + estáticos│
                └────────┬─────────┘   │ del build Vite    │
                         │             └──────────────────┘
                         ▼
                ┌──────────────────┐        ┌──────────────┐
                │ PostgreSQL (5432)│        │ Mailhog/SMTP │
                └──────────────────┘        └──────────────┘
```

El frontend y la API se sirven bajo el **mismo origen** a través de Nginx (`/` → frontend,
`/api/*` → backend), por lo que el navegador nunca necesita CORS cross-origin en producción.
`CORS_ORIGINS` sigue existiendo para escenarios de desarrollo donde el frontend corre en un
puerto distinto (`npm run dev`, puerto 5173) y llama directo al backend (puerto 3001).

## Backend — módulos (`backend/src/`)

| Módulo | Responsabilidad |
|---|---|
| `auth` | Login, refresh (cookie httpOnly rotativa), logout, forgot/reset password, change password |
| `users` | CRUD de usuarios, activar/desactivar, reset de contraseña por un admin |
| `roles` / `permissions` | RBAC: roles, permisos, asignación rol↔permiso |
| `public-content` | CMS del portal público: CRUD + publicar/destacar/ordenar, sanitización de HTML |
| `projects` | Portafolio, tareas (carta Gantt) y factibilidad (anidada por proyecto) |
| `minutes` | Actas y acuerdos |
| `knowledge` | Repositorio de conocimiento (interno + vista pública filtrada) |
| `communications` | Campañas/comunicaciones del Comité |
| `dashboard` | Agregaciones reales (KPIs, distribución por etapa, riesgos, acuerdos próximos) + KPIs ejecutivos curados vía `settings` |
| `uploads` | Subida de archivos con validación de magic bytes |
| `audit` | Bitácora de acciones sensibles |
| `mail` | Envío SMTP (Nodemailer) |
| `settings` | Almacén clave/valor genérico (JSON) para configuración institucional |
| `health` | Healthcheck público |
| `innovaia` | Integración configurable por entorno con un proveedor de IA (sin credenciales hardcodeadas) |

Todas las rutas pasan por dos guards globales: `JwtAuthGuard` (toda ruta requiere JWT salvo
`@Public()`) y `PermissionsGuard` (exige el permiso declarado con `@RequirePermissions()`).

## Modelo de datos (Prisma)

17 tablas — ver `backend/prisma/schema.prisma` para el detalle completo de columnas y relaciones:

`users`, `roles`, `permissions`, `role_permissions`, `refresh_tokens`, `password_reset_tokens`,
`public_content`, `projects`, `project_tasks`, `minutes`, `agreements`, `feasibility`,
`knowledge_items`, `communications`, `uploads`, `audit_logs`, `settings`.

Decisión de diseño: `feasibility` (factibilidad) se modeló como relación 1→N de `projects` en vez
de un módulo backend independiente, porque cada ficha de factibilidad pertenece siempre a un
proyecto — evita un módulo extra sin valor propio.

## Frontend (`frontend/src/`)

- `lib/api.ts` — cliente Axios único; intercepta 401 y refresca el access token automáticamente
  vía la cookie httpOnly antes de reintentar la petición original.
- `lib/auth-context.tsx` — `AuthProvider`/`useAuth()`; restaura sesión al cargar la app.
- `components/RequireAuth`, `RequirePermission` — guards de ruta declarativos.
- `pages/auth/*` — Login, recuperar/restablecer contraseña.
- `pages/admin/*` — CMS de contenido público, usuarios, roles, configuración, auditoría.
- `pages/public/*`, `pages/app/*` — vistas existentes del mockup original, sin cambios visuales.

## Autenticación — flujo de tokens

1. `POST /api/auth/login` → devuelve `accessToken` (JWT, 15 min) en el body y fija
   `refresh_token` (opaco, hash SHA-256 en BD) como cookie `httpOnly; SameSite=Lax; Path=/api/auth`.
2. El frontend guarda el `accessToken` **solo en memoria** (nunca en `localStorage`, mitiga robo
   por XSS) y lo envía como `Authorization: Bearer`.
3. Ante un 401, el interceptor llama a `POST /api/auth/refresh` (la cookie viaja sola); el backend
   rota el refresh token (revoca el usado, emite uno nuevo) y devuelve un `accessToken` nuevo.
4. `POST /api/auth/logout` revoca el refresh token activo.
5. Un reset de contraseña revoca **todas** las sesiones activas del usuario.
