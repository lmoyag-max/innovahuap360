# InnovaHUAP 360 — Guía de despliegue preproductivo (para Infraestructura)

Esta guía es para el equipo de Infraestructura que despliega y opera el stack en un servidor
preproductivo local. No requiere conocer el código de la aplicación, solo Docker.

Para el detalle de arquitectura, módulos y controles de seguridad implementados, ver
[`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) y [`docs/SEGURIDAD.md`](docs/SEGURIDAD.md). Para el
plan de recuperación ante desastres, ver [`docs/PLAN_RECUPERACION_DESASTRES.md`](docs/PLAN_RECUPERACION_DESASTRES.md).

---

## 1. Requisitos del servidor

- Linux (recomendado) o Windows con Docker Desktop.
- **Docker Engine 24+** y **Docker Compose v2** (plugin `docker compose`, no el binario
  standalone `docker-compose` v1).
- 2 vCPU / 4 GB RAM como mínimo (PostgreSQL + backend NestJS + frontend Nginx + proxy Nginx).
- 10 GB de disco libres como mínimo para imágenes, volúmenes y backups.
- Acceso a internet saliente solo durante el build (descarga de imágenes base y dependencias
  npm); en operación normal el stack no requiere salida a internet salvo el SMTP real.

Verificar versiones:

```bash
docker --version
docker compose version
```

## 2. Puertos requeridos

| Puerto | Servicio | Exposición |
|---|---|---|
| 80 | Nginx (punto de entrada único) | **Publicado al host** — es el único puerto que debe abrirse en el firewall hacia los usuarios |
| 5432 | PostgreSQL | Interno (red Docker), no publicado en preproducción |
| 3001 | Backend NestJS | Interno (red Docker), no publicado en preproducción |
| 8025 | Mailhog (UI de correos) | Solo si se usa `--profile dev`, no aplica en preproducción con SMTP real |

El frontend y la API se sirven bajo el mismo origen (`http://<host>/` y `http://<host>/api/*`),
por lo que no hace falta abrir más de un puerto.

## 3. Variables de entorno necesarias

Copiar la plantilla y completar valores reales **antes del primer despliegue**:

```bash
cp .env.example .env
```

| Variable | Descripción |
|---|---|
| `NODE_ENV` | `production` en preproducción (deshabilita Swagger, activa HSTS) |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Credenciales de la base de datos |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Generar con `openssl rand -hex 64`, distintos entre sí y por entorno |
| `CORS_ORIGINS` / `FRONTEND_URL` | URL pública del ambiente preproductivo (ej. `http://10.0.0.50` o el dominio interno asignado) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Datos del servidor SMTP real (recuperación de contraseña, notificaciones) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Usuario administrador inicial. Si se deja `ADMIN_PASSWORD` vacío, el seed genera una contraseña aleatoria y la imprime una sola vez en `docker compose logs backend` |
| `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` | Usuario super_admin de respaldo (acceso de emergencia/soporte), también creado por el seed. Mismo comportamiento que `ADMIN_PASSWORD` si se deja vacío — **definirla explícitamente antes del primer despliegue** |
| `RUN_SEED` | `true` solo en el primer despliegue (crea roles, permisos y los usuarios iniciales); cambiar a `false` después |
| `INNOVAIA_PROVIDER` / `GEMINI_API_KEY` | Opcional — dejar `INNOVAIA_PROVIDER=none` si no se usa el asistente de IA |

**Nunca** commitear el archivo `.env` con valores reales — ya está excluido por `.gitignore`.

## 4. Base de datos — cómo se monta

El proyecto usa **Prisma Migrate** (no scripts SQL sueltos): cada cambio de esquema vive como una
migración versionada en `backend/prisma/migrations/` (12 migraciones a la fecha, aplicadas en
orden cronológico). Esto es intencional — evita que un script SQL paralelo se desincronice del
esquema real de la aplicación.

Al levantar el contenedor `backend`, `backend/docker-entrypoint.sh` ejecuta automáticamente, en
este orden:

1. `npx prisma migrate deploy` — crea/actualiza todas las tablas, llaves primarias, foráneas e
   índices definidos en `backend/prisma/schema.prisma`.
2. Si `RUN_SEED=true`: el seed (`backend/prisma/seed.ts`) crea los roles base, los permisos, los
   módulos de navegación y los usuarios administrador/super_admin iniciales.

No se requiere ninguna acción manual sobre la base de datos para el primer despliegue: basta con
levantar el stack (sección 5). Para desplegar una migración nueva en un ambiente ya existente,
ver la sección 7 (flujo de actualización).

### Alternativa: base de datos externa (fuera de Docker)

Por defecto el stack levanta su propio contenedor `postgres`. Si Infraestructura provee una base
de datos PostgreSQL externa ya existente (separada de los contenedores de la aplicación, según el
modelo de arquitectura estándar), usar el override `docker-compose.externaldb.yml` en vez de
levantar Postgres en Docker:

1. En `.env` del servidor, definir `DATABASE_URL` apuntando a esa base externa (ver comentario en
   `.env.example`), por ejemplo:
   ```
   DATABASE_URL=postgresql://usuario:clave@host-externo:5432/innovahuap360
   ```
2. Agregar `-f docker-compose.externaldb.yml` a los comandos de la sección 5, y **listar
   explícitamente** los servicios a levantar para que Compose nunca cree el contenedor `postgres`:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml \
     -f docker-compose.externaldb.yml up -d --build backend frontend nginx
   ```

El resto del flujo (migraciones, seed) no cambia: `backend/docker-entrypoint.sh` sigue ejecutando
`prisma migrate deploy` contra el `DATABASE_URL` que corresponda, sea el Postgres en Docker o el
externo.

## 5. Comandos de operación

Todos los comandos usan el override de producción (`docker-compose.prod.yml`), que asegura
`NODE_ENV=production`, `RUN_SEED=false` por defecto y `restart: always`. Hay scripts listos en
`scripts/` (`.sh` para Linux/macOS, `.ps1` para Windows con Docker Desktop):

### Levantar el sistema

```bash
./scripts/preprod-up.sh
# o directamente:
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Detener el sistema

```bash
./scripts/preprod-down.sh
# o:
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
```

Esto detiene y elimina los contenedores, **no** los volúmenes (`postgres_data`,
`backend_uploads` persisten).

### Revisar logs

```bash
./scripts/preprod-logs.sh            # todos los servicios
./scripts/preprod-logs.sh backend    # solo un servicio
```

### Reconstruir contenedores (tras un `git pull`)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Respaldar la base de datos

```bash
./scripts/preprod-backup-db.sh
```

Genera `backups/innovahuap360_<fecha>_<hora>.sql` (carpeta `backups/` excluida de Git).

### Restaurar la base de datos

```bash
./scripts/preprod-restore-db.sh backups/innovahuap360_20260623_120000.sql
```

Pide confirmación explícita (escribir `RESTAURAR`) porque sobrescribe los datos actuales.

### Respaldar archivos subidos (uploads)

El volumen `backend_uploads` contiene los archivos cargados por usuarios (fichas, documentos,
fotos). Respaldo puntual:

```bash
docker run --rm -v innovahuap360_backend_uploads:/data -v "$(pwd)/backups":/backup alpine \
  tar czf /backup/uploads_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .
```

### Qué se respalda y con qué herramienta

| Componente | Contiene | Comando | Frecuencia recomendada |
|---|---|---|---|
| Volumen `postgres_data` | Todos los datos de la aplicación (usuarios, ideas, proyectos, actas, etc.) | `scripts/preprod-backup-db.sh` | Diaria |
| Volumen `backend_uploads` | Archivos subidos (fichas, fotos, documentos) | `docker run ... tar czf ...` (arriba) | Diaria o semanal, según volumen de carga |
| `.env` (raíz, fuera de Git) | Secretos y configuración del ambiente | Copia manual a un gestor de secretos institucional | Cada vez que cambie |
| Código fuente | Lógica de la aplicación | Git (`git tag` por cada entrega, ver sección 6) | En cada despliegue |

## 6. Flujo de actualización desde Git

```bash
git pull origin main
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Si el `git pull` trae migraciones nuevas de Prisma, se aplican solas al reiniciar el contenedor
`backend` (paso 1 de la sección 4) — no se necesita ningún comando manual adicional. Si la
actualización modifica variables de entorno nuevas, revisar `.env.example` y completar las que
falten en el `.env` real antes del `up --build`.

## 7. Validaciones posteriores al despliegue

- [ ] `curl http://<host>/api/health` responde `200`
- [ ] `docker compose -f docker-compose.yml -f docker-compose.prod.yml ps` — todos los servicios
      en estado `healthy`/`running`
- [ ] Login con el usuario administrador inicial funciona
- [ ] La aplicación carga en `http://<host>/` (frontend) y el panel admin en `http://<host>/app/admin`

Ver el detalle funcional completo en la sección 8 (checklist de validación) y en
[`docs/CHECKLIST_PRODUCCION.md`](docs/CHECKLIST_PRODUCCION.md) (checklist de seguridad/config).

## 8. Checklist de preproducción

### Infraestructura / despliegue

- [ ] `.env` completado con secretos reales y únicos (no los de `.env.example`)
- [ ] `SUPER_ADMIN_PASSWORD` definida explícitamente (no dejarla en blanco sin revisar los logs
      del primer arranque)
- [ ] `RUN_SEED=true` solo en el primer despliegue; `false` en despliegues posteriores
- [ ] Stack levantado con el override de producción (`docker-compose.prod.yml`), no el de
      desarrollo
- [ ] Puerto 5432 y 3001 **no** publicados al host (verificar con `docker compose -f ... ps` que
      solo Nginx expone puerto)
- [ ] SMTP real configurado y probado (no Mailhog)
- [ ] Respaldo inicial de la base de datos tomado antes de cualquier prueba destructiva
- [ ] Plan de respaldo periódico definido (cron + `scripts/preprod-backup-db.sh`, o snapshot del
      volumen `postgres_data` a nivel de infraestructura)

### Funcional (ver también `docs/CHECKLIST_PRODUCCION.md`)

- [ ] Login y logout
- [ ] Recuperación de contraseña (correo llega vía SMTP real)
- [ ] Banco de Ideas: una idea pública enviada crea automáticamente un proyecto interno asociado
- [ ] Gestión de proyectos (portafolio, tareas, Carta Gantt, factibilidad)
- [ ] Roles y permisos: un usuario sin permisos de administración no accede a `/app/admin/*`
- [ ] Contenido público visible en el portal (`/`, `/quienes-somos`, `/politica`, etc.)
- [ ] Dashboard carga KPIs reales
- [ ] Carga de archivos (ficha de idea, foto de integrante, documento de contenido público)
- [ ] **Persistencia de datos tras reiniciar contenedores**: `docker compose restart` (o
      `down` + `up`) y confirmar que los datos creados en las pruebas anteriores siguen presentes

### Seguridad (ver `docs/SEGURIDAD.md` y `docs/CHECKLIST_PRODUCCION.md`)

- [ ] HTTPS — si el ambiente preproductivo es accesible fuera de la red interna confiable, esto es
      bloqueante (las cookies de sesión usan `secure: true` en producción y no se envían sin TLS).
      Ver sección 9 para activarlo (requiere que Infraestructura provea dominio + DNS + puertos
      80/443 abiertos; el resto ya está resuelto en el repo)
- [ ] `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` no son los valores de ejemplo
- [ ] `ADMIN_PASSWORD`/`SUPER_ADMIN_PASSWORD` no son los valores de ejemplo
- [ ] `CORS_ORIGINS` apunta solo al dominio/IP real del ambiente, no a `*`

## 9. Habilitar HTTPS (Let's Encrypt)

Por defecto el stack sirve todo por HTTP (puerto 80). Habilitar HTTPS es **opcional y
explícito** — no se activa solo, para no romper un ambiente que hoy funciona por HTTP
mientras no estén listos sus requisitos.

**Responsabilidad de Infraestructura, antes de activarlo:**

- Dominio público (`DOMAIN_NAME`) con DNS apuntando a la IP de este servidor.
- Puertos **80 y 443** abiertos al exterior en el firewall (80 es obligatorio también en
  HTTPS: Let's Encrypt valida el dominio y emite/renueva el certificado por ahí).
- Una casilla de correo (`CERTBOT_EMAIL`) para los avisos de expiración de Let's Encrypt.

**Pasos:**

1. Completar en `.env`:
   ```
   DOMAIN_NAME=innova.ejemplo.cl
   CERTBOT_EMAIL=infraestructura@ejemplo.cl
   ```
2. Con el stack de preproducción ya levantado al menos una vez (sección 5), correr:
   ```bash
   ./scripts/preprod-init-https.sh
   # Windows: .\scripts\preprod-init-https.ps1
   ```
   El script crea un certificado temporal para que Nginx pueda arrancar, levanta el
   stack con `docker-compose.https.yml` agregado, solicita el certificado real a Let's
   Encrypt vía el challenge HTTP-01, y recarga Nginx con el certificado definitivo.
3. Verificar: `curl -I https://<DOMAIN_NAME>/api/health` debe responder `200`.

**De ahí en adelante**, todo `up`/reinicio del stack debe incluir el tercer archivo:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.https.yml up -d --build
```

La renovación del certificado es automática (contenedor `certbot`, revisa cada 12h y
renueva cuando falta poco para expirar; Nginx recarga su configuración cada 12h para
tomar el certificado renovado sin intervención manual).

**Nota para el flujo de actualización (sección 6):** si HTTPS ya está activo, agregar
`-f docker-compose.https.yml` al comando de `up -d --build` de esa sección.
