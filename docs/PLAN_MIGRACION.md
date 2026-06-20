# Plan de migración — Mockup → Plataforma productiva

Basado en `CLAUDE_MASTER_PROMPT_INNOVAHUAP360.md`. Ejecución secuencial,
autónoma, con commit local al cierre de cada fase (sin push).

## Principios

1. **No se rediseña el frontend.** Los layouts, tokens de marca y componentes
   `ui/` actuales se reutilizan tal cual. Las páginas migran de "leen un array
   importado" a "leen el mismo shape de datos vía API" — cambio interno, no
   visual.
2. **El backend modela el shape que el frontend ya consume**, para minimizar
   reescritura de componentes de presentación.
3. Cada fase es un commit local independiente y revertible.

## Fases y entregables

| Fase | Entregable concreto |
|---|---|
| 4 | `backend/` NestJS: `main.ts`, `app.module.ts`, Helmet, CORS, `ConfigModule`, módulos vacíos (auth, users, roles, permissions, public-content, projects, minutes, feasibility, gantt, knowledge, communications, dashboard, uploads, audit, mail, settings, health, innovaia) |
| 5 | `prisma/schema.prisma` con las 18 tablas mínimas + migraciones iniciales |
| 6 | `auth`: login, refresh, logout, Argon2, JWT access+refresh, guard global |
| 7 | `roles`/`permissions`: RBAC con guard `@Permissions()`, seed de roles base |
| 8 | `public-content`: CRUD + publicar/despublicar/destacar/ordenar, rutas admin en frontend |
| 9 | APIs REST de projects/minutes/feasibility/gantt/knowledge/communications/dashboard, todas con DTO + Zod/class-validator |
| 10 | Frontend: cliente Axios + interceptor refresh, TanStack Query por módulo, formularios con React Hook Form + Zod, páginas `/login`, `/recuperar-password`, `/restablecer-password/:token`, `/app/admin/*` |
| 11 | `mail`: Nodemailer + SMTP env vars, plantillas de recuperación de contraseña con token de un solo uso (hash + expiración) |
| 12 | `innovaia`: endpoint backend (stub seguro, sin credenciales hardcodeadas) + UI ya existente conectada |
| 13 | `Dockerfile` frontend (build Vite + Nginx estático), `Dockerfile` backend (multi-stage), `docker-compose.yml` (dev: incluye mailhog), `docker-compose.prod.yml`, Nginx reverse proxy |
| 14 | Rate limiting, CSP, HSTS, CORS restrictivo por entorno, sanitización de inputs, Swagger solo en `NODE_ENV!=production` |
| 15 | Build de frontend y backend, smoke test de rutas públicas/privadas, verificación de regresión visual manual |
| 16 | `docs/`: arquitectura, variables de entorno, runbook de despliegue |
| 17 | `.gitignore` raíz, `README.md` raíz de monorepo, `.env.example` |
| 18-19 | `docker-compose.prod.yml` validado, checklist de producción (`docs/CHECKLIST_PRODUCCION.md`) |
| 20 | Verificación de criterio final del prompt maestro |

## Fuera de alcance real en este entorno

- No hay servidor SMTP ni proveedor de IA real disponibles aquí: `mail` e
  `innovaia` se implementan con **interfaces reales y configuración por env**,
  pero sin credenciales de terceros (el usuario las completa en su `.env`).
- No se ejecuta despliegue a un servidor de producción real; "preproducción"
  significa `docker compose` levantando todo localmente con éxito.
