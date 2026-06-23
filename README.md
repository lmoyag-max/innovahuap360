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
- [`README_PREPROD.md`](README_PREPROD.md) — Guía operativa para Infraestructura: requisitos del
  servidor, comandos de despliegue/backup/restore y checklist de validación post-despliegue.
- [`docs/PLAN_RECUPERACION_DESASTRES.md`](docs/PLAN_RECUPERACION_DESASTRES.md) — Qué hacer ante
  caída de contenedores, corrupción de la base de datos, migraciones fallidas o pérdida total
  del servidor.
- [`docs/CLAUDE_MASTER_PROMPT_INNOVAHUAP360.md`](docs/CLAUDE_MASTER_PROMPT_INNOVAHUAP360.md) — Especificación
  funcional original del proyecto.

## Contenido Público — "Quiénes Somos"

`/quienes-somos` (portal público) es 100% administrable desde **Administración → Contenido
público → pestaña "Quiénes Somos"** (`/app/admin/contenido-publico`). Extiende el módulo
`public-content` ya existente (no se creó un módulo paralelo):

- **Encabezado y descripción**: título, bajada, imagen, texto principal/secundario, misión,
  visión, propósito — reutiliza la tabla `public_content` (fila única, `slug="quienes-somos"`).
- **Integrantes, Ejes, Objetivos, Valores**: listas propias (`about_members`, `about_axes`,
  `about_objectives`, `about_values`) con alta/edición/eliminación, activar/desactivar y
  reordenamiento (flechas arriba/abajo). Los integrantes admiten foto opcional (PNG/JPG/WEBP,
  10 MB máx., validada por contenido real del archivo, no solo la extensión).
- **Documentos** (`about_documents`): sube PDF/DOC/DOCX, publica/despublica, reordena. Se sirven
  públicamente solo si están publicados, sin exponer la ruta física en disco.
- Cada acción (crear/editar/eliminar/publicar/despublicar/reordenar/subir archivo/**duplicar**)
  queda auditada (`AuditLog`, acciones `about.*`) con usuario, fecha y entidad afectada.
- Permisos: `public_content.manage` (crear/editar), `public_content.publish` (publicar/destacar)
  y `public_content.delete` (eliminar — **solo admin y super_admin**; coordinador puede crear,
  editar y publicar, pero no eliminar). Ver más abajo.
- La página pública consume `GET /api/public/quienes-somos` (sin sesión); si la API no responde
  cae a los datos estáticos que tenía antes (`frontend/src/data/public.ts`) — si la API responde
  pero el contenido está despublicado, muestra un aviso en vez de inventar contenido.
- Migración no destructiva: el seed migró los 6 integrantes y el encabezado que ya estaban
  hardcodeados en el portal hacia las tablas nuevas, así el sitio se ve igual apenas se despliega.

## Contenido Público — Política, Portafolio, Observatorio, Conocimiento, Eventos

Las 5 secciones públicas restantes se administran desde **Administración → Contenido público**
(`/app/admin/contenido-publico`), con pestañas en este orden exacto: Quiénes Somos, Política,
Portafolio, Observatorio, Conocimiento, Eventos, Contenido genérico (HOME/NOTICIA/BANNER). Cada
una es un **CRUD real** (crear, editar, eliminar, publicar/ocultar, destacar, reordenar,
duplicar) — no solo edición parcial o toggles de visibilidad.

- **Política** (`/politica`): encabezado propio (título/bajada/texto principal/estado, fila única
  `slug="politica"`) + items de `public_content` (`itemType`: PRINCIPIO/LINEAMIENTO/OBJETIVO/
  DOCUMENTO) con documento adjunto opcional. CRUD completo vía los endpoints genéricos del CMS
  (`POST/PATCH/DELETE /admin/public-content`, etc.); encabezado en
  `GET/PUT /admin/public-content/politica`.
- **Observatorio** (`/observatorio`) y **Eventos** (`/eventos`): mismo mecanismo de items de
  `public_content` (sin encabezado propio), usando los campos `category`, `itemType`, `linkUrl`
  y, para Eventos, `eventDate`/`eventLocation`/`registrationUrl`. La página pública consume el
  `GET /public-content?section=OBSERVATORIO|EVENTOS` ya existente.
- **Portafolio** (`/portafolio`): es una **publicación pública independiente**, separada del
  seguimiento real del proyecto — **Portafolio Interno** (etapas, riesgo, factibilidad, tareas en
  `/app/portafolio`, modelo `Project`) no se modifica ni se duplica su lógica. Cada publicación
  (`public_content`, `section=PORTAFOLIO`) tiene imagen principal, descripción pública, beneficios
  esperados (`expectedBenefits`) y puede **opcionalmente** vincularse a un proyecto interno real
  solo como referencia (`relatedProjectId`, `onDelete: SetNull`) — eliminar la publicación pública
  nunca borra ni modifica el proyecto. CRUD completo vía los mismos endpoints genéricos del CMS;
  `GET /admin/public-content/portafolio/proyectos` alimenta el selector de "proyecto relacionado".
  La página pública consume `GET /public-content?section=PORTAFOLIO`.
- **Conocimiento** (`/conocimiento`): CRUD completo (documentos, manuales, guías, casos de éxito,
  artículos, enlaces) reutilizando directamente los endpoints reales de `/knowledge` — el mismo
  backend que ya usaba el módulo interno `/app/conocimiento` (`KnowledgeItem`, permiso
  `knowledge.manage`); no se duplicó el modelo. La pestaña "Conocimiento" de Contenido Público
  agrega create/editar/eliminar/publicar ahí mismo (antes solo permitía alternar visibilidad).
  Se agregó `linkUrl` a `KnowledgeItem` para ítems de tipo "Enlace" sin archivo adjunto, y un
  endpoint público seguro `GET /public/knowledge/:id/file` (gateado por `isPublic` del propio
  ítem, sin requerir sesión) — antes la descarga pública dependía de `/uploads/:id/download`, que
  exige sesión y por lo tanto nunca funcionó para visitantes anónimos.
- **Documentos descargables**: cualquier item de `public_content` admite un archivo adjunto
  (PDF/DOC/DOCX, mismo `UploadsService` validado por contenido real del archivo) vía
  `POST/DELETE /admin/public-content/:id/document`; se sirve públicamente solo si el item está
  publicado (`GET /public/content/:id/document`), sin exponer la ruta física en disco.
- **Permisos**: `public_content.manage` (crear/editar/duplicar/reordenar/subir archivo),
  `public_content.publish` (publicar/despublicar/destacar) y `public_content.delete` (eliminar).
  Reemplazan al antiguo `content.manage` (eliminado del seed). Asignación: admin y super_admin
  tienen los tres; coordinador tiene `manage` y `publish` pero **no** `delete` — solo
  administradores pueden eliminar contenido público, como en el resto del sistema.
- Auditoría: acciones `politica.*`, `public_content.document_*`, además de las ya existentes
  (`about.*`, `public_content.create/update/delete/published/featured/reorder`). Conocimiento usa
  la auditoría propia del módulo `/knowledge`.
- Migración no destructiva: el seed migró los documentos de política, el destacado y artículos del
  observatorio, la agenda de eventos, los recursos de conocimiento (a `knowledge_items`) y los
  proyectos de ejemplo del portafolio (a `projects`, solo si la tabla no tenía proyectos públicos
  reales) — el sitio se ve igual apenas se despliega esta migración.

## Correo (SMTP)

Módulo centralizado en `backend/src/mail/` (`MailModule` → `MailService` + `MailController`), usado por
recuperación de contraseña, Banco de Ideas y el panel de administración. Plantillas Handlebars en
`backend/src/mail/templates/*.hbs`.

**Configurar SMTP**

1. Completa en `backend/.env` (o en el `.env` de la raíz si usas Docker Compose):
   ```
   SMTP_HOST=mail.huap.online
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=operaciones@huap.online
   SMTP_PASS=<contraseña real — solo en este archivo, nunca en .env.example ni en Git>
   SMTP_FROM=operaciones@huap.online
   SMTP_FROM_NAME=InnovaHUAP 360
   ```
2. En desarrollo con Docker (perfil `dev`) puedes usar Mailhog en vez del SMTP real: deja
   `SMTP_HOST=mailhog`, `SMTP_PORT=1025`, `SMTP_SECURE=false`, sin usuario/contraseña. Los correos
   quedan capturados en http://localhost:8025 sin salir a Internet.
3. Reinicia el backend (`docker compose --profile dev up -d --force-recreate backend` o
   `npm run start:dev`) para que tome las variables nuevas.

**Probar `/mail/health`** (requiere sesión con permiso `settings.manage`):

```bash
curl http://localhost/api/mail/health -H "Authorization: Bearer <accessToken>"
```

Devuelve `host/port/user/from/fromName` (nunca `SMTP_PASS`) y el resultado de una verificación de
conexión + autenticación en vivo (`connection: "ok" | "error"`). También disponible desde
**Administración → Correo** (`/app/admin/correo`) en la plataforma interna.

**Probar `/mail/test`** (mismo permiso, limitado a 3 envíos/minuto):

```bash
curl -X POST http://localhost/api/mail/test \
  -H "Authorization: Bearer <accessToken>" -H "Content-Type: application/json" \
  -d '{"to":"tu-correo@huap.cl"}'
```

Responde `204 No Content` si el envío fue aceptado por el SMTP; cualquier falla queda en los logs
del backend (`docker compose logs backend`) sin exponer la contraseña, y la acción se audita como
`mail.test_sent`.

**Validar recuperación de contraseña**: `POST /api/auth/forgot-password` con `{"email": "..."}`
siempre responde igual exista o no el correo (anti-enumeración); si el usuario existe y está
activo, dispara `sendForgotPasswordEmail`. Tras restablecer (`POST /api/auth/reset-password`) o
cambiar la propia contraseña (`POST /api/auth/change-password`), se envía además un correo de
confirmación (`sendPasswordResetSuccessEmail`) y se cierran las sesiones activas.

**Revisar errores**: el envío de correo nunca bloquea el flujo que lo dispara (login, recuperación,
triage de ideas) — un fallo de SMTP solo queda registrado en `docker compose logs backend` con el
prefijo `[MailService]`. Causas típicas: credenciales incorrectas, el destinatario no existe en el
dominio receptor (rechazo 550) o el puerto 465/587 bloqueado por firewall.

**Cambiar la contraseña SMTP**: edita `SMTP_PASS` en el `.env` correspondiente y reinicia el
backend. Nunca se guarda en código, logs ni se devuelve por API.

**Proteger `.env`**: `.env`, `.env.*` están en `.gitignore` (con excepción explícita de
`!.env.example`) tanto en la raíz como en `backend/`. Verifica con `git check-ignore -v .env
backend/.env` antes de hacer commits.

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
`/app/admin/configuracion` · `/app/admin/correo` · `/app/admin/auditoria`

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
