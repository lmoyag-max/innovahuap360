# Plan de recuperación ante desastres

Escenarios de falla del stack de InnovaHUAP 360 en preproducción/producción y cómo recuperarse
de cada uno. Complementa [`README_PREPROD.md`](../README_PREPROD.md) (operación normal) y
[`docs/CHECKLIST_PRODUCCION.md`](CHECKLIST_PRODUCCION.md) (configuración antes de desplegar).

## Qué se pierde y qué no, por tipo de incidente

| Incidente | ¿Se pierden datos? | ¿Se pierden archivos subidos? | ¿Se pierde el código? |
|---|---|---|---|
| Reinicio del servidor / `docker compose restart` | No | No | No |
| `docker compose down` (sin `-v`) | No | No | No |
| Contenedor `backend`/`frontend` corrompido, se reconstruye | No | No | No |
| `docker compose down -v` (borra volúmenes) | **Sí, si no hay backup** | **Sí, si no hay backup** | No |
| Disco del servidor dañado/perdido | **Sí, si no hay backup** | **Sí, si no hay backup** | No (vive en Git) |
| Migración de Prisma mal aplicada | Posible corrupción de esquema | No | No |
| Deploy con bug nuevo | No (datos intactos) | No | Se revierte con Git |

## Escenario 1 — Caída de un contenedor (backend, frontend o Nginx)

**Síntoma:** `docker compose ps` muestra el servicio como `Exited` o `unhealthy`.

1. Revisar la causa: `./scripts/preprod-logs.sh <servicio>`.
2. Reintentar el arranque: `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d <servicio>`.
3. Si persiste, reconstruir solo ese servicio:
   `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build <servicio>`.

No hay pérdida de datos en este escenario — `postgres_data` y `backend_uploads` son volúmenes
independientes del ciclo de vida del contenedor.

## Escenario 2 — Postgres no arranca o el contenedor se corrompe

1. Verificar que el volumen `postgres_data` sigue existiendo: `docker volume ls | grep postgres_data`.
2. Si el volumen existe, recrear solo el contenedor: `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate postgres`.
3. Si el volumen se perdió o está corrupto, restaurar desde el último backup:
   `./scripts/preprod-restore-db.sh backups/<último_backup>.sql` (requiere que el contenedor
   `postgres` esté arriba y vacío antes de restaurar).

**Esto es exactamente por qué el respaldo periódico (sección "Qué se respalda" de
`README_PREPROD.md`) no es opcional.**

## Escenario 3 — Migración de Prisma falla a mitad de despliegue

`backend/docker-entrypoint.sh` ejecuta `prisma migrate deploy` antes de iniciar la API. Si una
migración falla:

1. El contenedor `backend` no llega a `healthy` — el resto del stack sigue funcionando con el
   código anterior porque Docker Compose no reemplaza un servicio sano por uno que falla al
   arrancar.
2. Revisar el log exacto: `./scripts/preprod-logs.sh backend`.
3. Si la migración deja el esquema en un estado intermedio, **restaurar el backup tomado antes
   del despliegue** (ver sección 6 de `README_PREPROD.md`, paso 1 del flujo de actualización) y
   coordinar con el equipo de desarrollo antes de reintentar.

## Escenario 4 — Deploy con un bug nuevo (regresión funcional)

1. Confirmar el bug y, si es posible, identificar el tag/commit anterior estable:
   `git log --oneline -10`.
2. Volver el código a la versión anterior:
   `git checkout <tag_o_commit_anterior>`.
3. Reconstruir: `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build`.
4. Los datos no se ven afectados — solo se revierte código. Si el bug ya escribió datos
   incorrectos en la base, evaluar si corresponde restaurar el backup anterior al deploy
   problemático en vez de (o además de) revertir el código.

## Escenario 5 — Pérdida total del servidor (disco, hardware, VM destruida)

Requiere haber mantenido backups **fuera del propio servidor** (copiados a otro equipo, NAS o
almacenamiento institucional) — un backup que vive solo en `backups/` del mismo servidor no
sobrevive a este escenario.

1. Provisionar un servidor nuevo con Docker Engine 24+ y Docker Compose v2 (ver sección 1 de
   `README_PREPROD.md`).
2. `git clone https://github.com/lmoyag-max/innovahuap360.git`
3. Restaurar `.env` desde el respaldo de configuración (no vive en Git).
4. Levantar el stack con `RUN_SEED=false` (no se necesita reseed si se va a restaurar la BD):
   `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build`.
5. Restaurar la base de datos: `./scripts/preprod-restore-db.sh <último_backup_externo>.sql`.
6. Restaurar `backend_uploads` desde el respaldo externo de archivos:
   ```bash
   docker run --rm -v innovahuap360_backend_uploads:/data -v "$(pwd)/backups":/backup alpine \
     tar xzf /backup/<archivo_uploads>.tar.gz -C /data
   ```
7. Verificar con la sección 7 de `README_PREPROD.md` (validaciones posteriores al despliegue).

## Objetivos de recuperación (referencia, ajustar según lo que defina Infraestructura)

| Métrica | Valor sugerido |
|---|---|
| RPO (pérdida de datos máxima aceptable) | 24 horas (si el backup es diario) |
| RTO (tiempo máximo de inactividad aceptable) | Tiempo de provisión de un servidor nuevo + restauración de backups (típicamente 1-2 horas con backups externos disponibles) |

Estos valores dependen de la frecuencia real de backup que defina Infraestructura — si se
necesita un RPO menor a 24 horas, aumentar la frecuencia de `scripts/preprod-backup-db.sh` (cron
cada N horas) en vez de cambiar el script.
