# Checklist antes de producción

## Obligatorio

- [ ] `.env` en la raíz con secretos **reales y únicos** (no los de `.env.example`):
  - [ ] `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — generar con `openssl rand -hex 64`
  - [ ] `POSTGRES_PASSWORD` fuerte
  - [ ] `ADMIN_PASSWORD` definido explícitamente (o capturar la contraseña generada en
        `docker compose logs backend` en el primer arranque y cambiarla de inmediato)
  - [ ] `SUPER_ADMIN_PASSWORD` definido explícitamente (mismo criterio que `ADMIN_PASSWORD` —
        si se deja vacío, el seed genera una aleatoria y la imprime una sola vez en logs)
- [ ] `NODE_ENV=production` (deshabilita Swagger y activa HSTS automáticamente)
- [ ] `CORS_ORIGINS` y `FRONTEND_URL` apuntando al dominio público real
- [ ] SMTP real configurado (`SMTP_HOST/PORT/USER/PASS/FROM`) — Mailhog es solo para desarrollo
- [ ] `RUN_SEED=false` después del primer despliegue (el seed ya corrió una vez)
- [ ] Desplegar con el override de producción:
      `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build`
      (sin esto, Postgres y el backend quedan con sus puertos publicados al host)

## HTTPS (pendiente de certificados — no incluido en este entorno)

- [ ] Obtener certificados (Let's Encrypt / certificado institucional)
- [ ] Agregar un `server { listen 443 ssl; ... }` en `nginx/nginx.conf` con
      `ssl_certificate` / `ssl_certificate_key`
- [ ] Redirigir HTTP → HTTPS (`return 301 https://$host$request_uri;`)
- [ ] Confirmar que `app.set('trust proxy', 1)` (ya activo) y que Nginx envía
      `X-Forwarded-Proto` correctamente para que las cookies `secure` se marquen bien

## Verificación funcional (smoke test)

- [ ] `GET /api/health` responde `200`
- [ ] Login con el usuario administrador funciona y `mustChangePass` fuerza buen criterio de
      cambio de contraseña en el primer ingreso
- [ ] Recuperación de contraseña entrega el correo (verificar con el SMTP real, no Mailhog)
- [ ] Un usuario sin permisos de administración no puede ver ni acceder a `/app/admin/*`
- [ ] Publicar contenido en `/app/admin/contenido-publico` y confirmar que aparece en el portal
      público correspondiente
- [ ] Revisar `/app/admin/auditoria` y confirmar que se registran login, cambios de contraseña, etc.
- [ ] Enviar una idea desde el Banco de Ideas público y confirmar que se crea automáticamente el
      proyecto interno asociado
- [ ] Subir un archivo (ficha de idea, foto de integrante, documento de contenido público) y
      confirmar que se descarga correctamente
- [ ] `docker compose restart` (o `down` + `up`) y confirmar que los datos creados en las pruebas
      anteriores siguen presentes (persistencia de `postgres_data`/`backend_uploads`)

## Backups

- [ ] Definir respaldo periódico del volumen `postgres_data` (`pg_dump` programado o snapshot del
      volumen Docker)
- [ ] Definir respaldo del volumen `backend_uploads` (archivos subidos)

## Observabilidad mínima

- [ ] Centralizar logs de los contenedores (`docker compose logs` no es suficiente para producción
      sostenida; considerar un agregador externo)
- [ ] Alertar sobre el healthcheck de `backend` y `postgres`

## Seguimiento técnico (ver `docs/SEGURIDAD.md`)

- [ ] Programar la actualización de NestJS 10→11 y Nodemailer 6→9 (resuelven los hallazgos
      restantes de `npm audit`) en un ciclo con QA dedicado
