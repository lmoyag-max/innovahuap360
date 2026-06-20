# INNOVAHUAP 360 — Plataforma del Comité de Innovación

Plataforma del Comité de Innovación del **Hospital de Urgencia Asistencia Pública (HUAP — Posta Central)**.
Combina un **portal público** de innovación con una **plataforma interna** de gestión (dashboards, portafolio,
actas, factibilidad, Gantt, conocimiento, comunicaciones, InnovaIA) y un **panel de administración** con
autenticación, RBAC, gestión de contenido y auditoría.

> Eslogan: _"Transformando ideas en impacto para la salud pública"._

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + React Router + TanStack Query + React Hook Form + Zod |
| Backend | NestJS + TypeScript + REST + JWT (access + refresh) + Argon2 + Helmet + Rate limiting |
| Base de datos | PostgreSQL + Prisma ORM |
| Correo | Nodemailer (SMTP), Mailhog en desarrollo |
| Infraestructura | Docker, Docker Compose, Nginx (reverse proxy) |

## Estructura del monorepo

```
innovahuap360-react/
├─ frontend/         # SPA React (portal público + plataforma interna + admin)
├─ backend/          # API NestJS (auth, RBAC, CMS, módulos, mail, InnovaIA)
├─ nginx/            # Reverse proxy único del stack (nginx.conf)
├─ docs/             # Documentación técnica (auditoría, plan, seguridad, etc.)
├─ docker-compose.yml
├─ docker-compose.prod.yml
└─ .env.example      # Variables para docker-compose
```

Detalle de cada paquete: [`backend/`](backend) y [`frontend/`](frontend) (ver sus propios `package.json`).

## Puesta en marcha con Docker (recomendado)

Requiere **Docker** y **Docker Compose**.

```bash
cp .env.example .env        # completa los secretos (JWT, contraseñas, etc.)
docker compose --profile dev up -d --build
```

Esto levanta: PostgreSQL, el backend (aplica migraciones y crea el usuario administrador inicial),
el frontend y Nginx como punto de entrada único. El perfil `dev` agrega Mailhog para capturar los
correos de recuperación de contraseña sin un SMTP real.

Por defecto **solo Nginx (puerto 80)** queda publicado al host — Postgres y el backend no exponen
sus puertos (igual que en producción). Para inspeccionar la base de datos o llamar a la API
directo durante el desarrollo, suma el override de conveniencia:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml --profile dev up -d --build
```

- Aplicación: http://localhost
- Mailhog (correos capturados): http://localhost:8025
- Swagger (solo si `NODE_ENV != production`): http://localhost/api/docs *(detrás del proxy)* o `http://localhost:3001/api/docs` directo al backend

El usuario administrador inicial se crea con `ADMIN_EMAIL` / `ADMIN_PASSWORD` del `.env` (si no se define
`ADMIN_PASSWORD`, el seed genera una contraseña aleatoria y la imprime una sola vez en los logs del
backend: `docker compose logs backend`).

Para producción:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Ver [`docs/CHECKLIST_PRODUCCION.md`](docs/CHECKLIST_PRODUCCION.md) antes de desplegar.

## Puesta en marcha en local sin Docker (desarrollo)

Requiere **Node.js 20+**, **npm 9+** y una instancia de **PostgreSQL** accesible.

```bash
# Backend
cd backend
cp .env.example .env          # ajusta DATABASE_URL y los secretos JWT
npm install
npm run prisma:migrate        # crea las tablas
npm run prisma:seed           # roles, permisos y usuario administrador
npm run start:dev             # http://localhost:3001/api

# Frontend (en otra terminal)
cd frontend
cp .env.example .env          # VITE_API_URL=http://localhost:3001/api
npm install
npm run dev                   # http://localhost:5173
```

## Documentación

- [`docs/AUDITORIA.md`](docs/AUDITORIA.md) — Estado inicial del proyecto (mockup) y decisiones de migración.
- [`docs/AUDITORIA_MODULOS_INTERNOS.md`](docs/AUDITORIA_MODULOS_INTERNOS.md) — Auditoría funcional de los
  9 módulos internos + propuesta y estado de Banco de Ideas y Pipeline de Innovación.
- [`docs/PLAN_MIGRACION.md`](docs/PLAN_MIGRACION.md) — Plan de fases ejecutado.
- [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) — Arquitectura del sistema, módulos y modelo de datos.
- [`docs/SEGURIDAD.md`](docs/SEGURIDAD.md) — Controles OWASP implementados y estado de `npm audit`.
- [`docs/CHECKLIST_PRODUCCION.md`](docs/CHECKLIST_PRODUCCION.md) — Checklist antes de desplegar a producción.
- [`docs/CLAUDE_MASTER_PROMPT_INNOVAHUAP360.md`](docs/CLAUDE_MASTER_PROMPT_INNOVAHUAP360.md) — Especificación
  funcional original del proyecto.

## Rutas

### Portal público
`/` · `/quienes-somos` · `/politica` · `/portafolio` · `/observatorio` · `/conocimiento` · `/eventos` · `/postula`

### Autenticación
`/login` · `/recuperar-password` · `/restablecer-password/:token`

### Plataforma interna (requiere sesión)
`/app` · `/app/ideas` · `/app/portafolio` · `/app/actas` · `/app/factibilidad` · `/app/gantt` ·
`/app/conocimiento` · `/app/comunicaciones` · `/app/innovaia` · `/app/ejecutivo`

### Administración (requiere permisos RBAC)
`/app/admin` · `/app/admin/contenido-publico` · `/app/admin/usuarios` · `/app/admin/unidades` · `/app/admin/roles` ·
`/app/admin/configuracion` · `/app/admin/auditoria`

## Identidad visual

- **Acento de marca:** rojo institucional HUAP `#ed1d25` (variable CSS `--accent`, alternable a azul
  salud `#2a6fdb` con `data-accent="blue"` en `<html>`).
- **Tipografía:** Hanken Grotesk (texto) + JetBrains Mono (datos, etiquetas, métricas).
- Tokens de diseño en `frontend/src/index.css`, expuestos a Tailwind en `frontend/tailwind.config.ts`.
  **No se modificaron** durante la migración a plataforma productiva.

## Estado conocido / próximos pasos

Los 9 módulos internos (Dashboard general, Portafolio, Actas, Factibilidad, Carta Gantt,
Conocimiento, Comunicaciones, InnovaIA, Dashboard Ejecutivo) están conectados a sus APIs reales
— ya no quedan datos de ejemplo en `/app/*`. Se agregaron además dos módulos nuevos:

- **Banco de Ideas** (`/postula` público + `/app/ideas` interno): formulario oficial con datos
  del solicitante, unidad/servicio (tabla maestra `units`, editable en Administración → Unidades
  y Servicios, con importación desde Excel), tipo y etapa de proyecto, aprobación de jefatura y
  **ficha técnica obligatoria** (se descarga una plantilla `.docx`, se completa y se vuelve a
  subir). El Comité hace triage con 8 estados, comentarios y notificaciones por correo (SMTP), y
  puede convertir una idea aprobada en un proyecto real del portafolio.
- **Pipeline de Innovación**: gobernanza de cambio de etapa sobre `Project`
  (`PATCH /projects/:id/stage`), con trazabilidad en `project_stage_history` y un primer gate
  (no se puede avanzar a Piloto/Implementación/Escalamiento sin factibilidad registrada).

El detalle completo de la auditoría funcional módulo por módulo —qué se conectó, qué queda como
siguiente iteración (p. ej. plantilla de factibilidad ponderada, dependencias en la Carta Gantt,
integración con un proveedor real de email marketing)— está en
[`docs/AUDITORIA_MODULOS_INTERNOS.md`](docs/AUDITORIA_MODULOS_INTERNOS.md). Autenticación,
recuperación de contraseña, RBAC, administración de contenido público, auditoría y Docker
siguen implementados y verificados de extremo a extremo.

---

© 2026 HUAP · Posta Central · Santiago de Chile
