# Seguridad — Fase 14 (Hardening OWASP)

## Controles implementados

| Control | Dónde | Detalle |
|---|---|---|
| Hashing de contraseñas | `backend/src/auth`, `users` | Argon2 (nunca se guarda texto plano ni reversible) |
| JWT de acceso de corta duración | `auth.service.ts` | 15 min por defecto, firmado con secreto propio |
| Refresh token rotativo | `auth.service.ts`, tabla `refresh_tokens` | Opaco, hash SHA-256 en BD, cookie `httpOnly` + `SameSite=Lax`, se revoca y reemplaza en cada uso |
| Recuperación de contraseña | `auth.service.ts`, tabla `password_reset_tokens` | Token de un solo uso, expira en 30 min, respuesta idéntica exista o no el correo (anti-enumeración) |
| RBAC | `roles`, `permissions`, `PermissionsGuard` | Guard global; cada endpoint sensible exige un permiso explícito |
| Rate limiting | `ThrottlerModule` (global) + `@Throttle` en login/forgot-password | 120 req/min global; 5/min login; 3/min forgot-password |
| Cabeceras de seguridad | Helmet (API) + Nginx (`frontend/nginx.conf`, `nginx/nginx.conf`) | CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS (solo en producción) |
| CORS restrictivo | `main.ts`, env `CORS_ORIGINS` | Lista blanca por entorno; en el despliegue con Nginx el frontend y la API comparten origen, por lo que el navegador ni siquiera necesita CORS |
| Validación de entrada | `ValidationPipe` global | `whitelist + forbidNonWhitelisted` — rechaza campos no declarados en los DTO |
| Sanitización de HTML | `public-content.service.ts` (`sanitize-html`) | Limpia el cuerpo del contenido público antes de persistir (anti XSS almacenado) |
| Subida de archivos | `uploads` | Lista blanca de MIME + **verificación de magic bytes** del contenido real (no solo la cabecera declarada por el cliente), nombre de archivo aleatorio, límite de 10 MB |
| Auditoría | `audit_logs`, `AuditService` | Login, fallos de login, cambios/reset de contraseña, etc. |
| Manejo de errores | `AllExceptionsFilter` | Nunca expone stack traces ni mensajes internos al cliente |
| Swagger | `main.ts` | Solo se monta si `NODE_ENV !== production` |
| Base de datos no expuesta | `docker-compose.prod.yml` | Sin publicar el puerto de Postgres al host en producción |
| Backend no root en contenedor | `backend/Dockerfile` | Usuario `innovahuap` sin privilegios |
| `trust proxy` | `main.ts` | El stack corre siempre detrás de Nginx; sin esto, el rate limiting y la IP de auditoría quedarían mal atribuidos a la IP del proxy |
| Server tokens ocultos | `nginx/nginx.conf`, `frontend/nginx.conf` | `server_tokens off` — no se anuncia la versión de Nginx |

## Banco de Ideas — controles específicos

| Control | Dónde | Detalle |
|---|---|---|
| Subida de ficha técnica | `ideas.controller.ts` | Lista blanca DOC/DOCX/PDF por extensión **y** verificación de magic bytes real (`uploads.service.ts`: OLE para `.doc`, ZIP `PK\x03\x04` para `.docx`, `%PDF` para PDF). Bloquea por diseño EXE/BAT/CMD/JS y cualquier archivo cuyo contenido no coincida con el tipo declarado. Límite de 10 MB. |
| Rate limiting en rutas públicas sin sesión | `ideas.controller.ts` | `POST /public/ideas` 5 req/min/IP; `POST /public/ideas/upload-ficha` 10 req/min/IP — mismo criterio que `auth.controller.ts` para rutas públicas sensibles |
| Import de unidades desde Excel | `units.controller.ts` | Requiere `units.manage` (solo administradores autenticados, no es una ruta pública); límite de 2 MB; solo MIME de Excel |
| **Riesgo residual documentado:** `xlsx` (SheetJS) tiene 2 CVE de severidad alta sin parche publicado en el registro de npm (prototype pollution y ReDoS — los fixes de SheetJS solo se distribuyen por su propio CDN, fuera de npm). Se acepta el riesgo porque el endpoint que lo usa está detrás de `units.manage` (no es de cara al público) y el archivo está acotado a 2 MB. **Seguimiento recomendado:** migrar a la distribución oficial de SheetJS fuera de npm, o a una librería de parseo de Excel sin este historial, en un ciclo dedicado. | | |
| Auditoría de decisiones del Comité | `audit_logs` vía `AuditService` | `ideas.status_change` y `ideas.comment` quedan registrados con usuario y metadata (estado anterior/nuevo) |
| Trazabilidad de cambios de estado | `idea_status_history` | Tabla append-only — nunca se sobrescribe, solo se agregan filas |
| Notificaciones no bloqueantes | `mail.service.ts` (`sendMail`) | Un fallo de SMTP se loguea pero nunca interrumpe la creación/triage de una idea (evita que un problema de correo tumbe el flujo operativo) |

## Resultado de `npm audit`

### Backend

Quedan vulnerabilidades **transitivas** (no de código propio) sin parche no-breaking disponible a la fecha:

- `multer` / `qs` / `express` (via `@nestjs/platform-express` 10.x) — DoS (alto/moderado). El fix requiere subir a NestJS 11, un cambio mayor no validado en este ciclo.
- `nodemailer` — varias CVE de tipo DoS/inyección de cabecera SMTP. El fix requiere saltar de la rama 6.x a 9.x.
- `lodash` (via `@nestjs/config`) — prototype pollution. Transitiva, sin control directo.
- `webpack`/`tmp`/`inquirer` (via `@nestjs/cli`) — son herramientas de **build/desarrollo**, no se incluyen en la imagen Docker de producción (`backend/Dockerfile` solo copia `dist/` + `node_modules` de producción).

**Decisión:** no se forzó `npm audit fix --force` (saltos de versión mayor) sin poder re-validar exhaustivamente el comportamiento en este ciclo — el riesgo de romper funcionalidad ya probada (login, RBAC, CMS) es mayor que el de estos DoS, mitigados además por el rate limiting y el límite de tamaño de body por defecto de Express (100kb). **Recomendación de seguimiento:** programar la migración a NestJS 11 / nodemailer 9 en un ciclo dedicado, con su propio QA.

### Frontend

- `esbuild`/`vite` — vulnerabilidad de **solo el servidor de desarrollo** (permite a un sitio web leer respuestas del dev server si la víctima lo tiene corriendo y visita un sitio malicioso). No afecta el build de producción servido por Nginx. Mismo criterio: la actualización a Vite 8 es un salto mayor que no se valida en este ciclo.

## Pendiente / fuera de alcance de este entorno

- No hay certificado TLS real disponible aquí. `nginx/nginx.conf` está listo para producción HTTP; agregar HTTPS requiere certificados (Let's Encrypt/cert-manager) y un `server { listen 443 ssl; }` adicional — ver `docs/CHECKLIST_PRODUCCION.md`.
- No se ejecutó un escaneo de dependencias (`npm audit`) como gate de CI; se recomienda agregarlo a un pipeline.
