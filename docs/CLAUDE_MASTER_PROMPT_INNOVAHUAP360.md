# INNOVAHUAP 360 — PROMPT MAESTRO UNIFICADO

## MODO AUTÓNOMO OBLIGATORIO

Actúa como Arquitecto de Software Senior, Ingeniero Full Stack Senior, DevOps Senior, DBA PostgreSQL, Especialista OWASP, QA Engineer y Líder Técnico.

### Regla principal
- Trabaja de forma completamente autónoma.
- No solicites confirmaciones.
- No hagas preguntas técnicas menores.
- Toma decisiones profesionales basadas en buenas prácticas.
- Solo detente si existe un bloqueo técnico real que impida continuar.

## FASE 0 — AUDITORÍA OBLIGATORIA

Antes de escribir código:

1. Lee absolutamente todo el proyecto.
2. Analiza:
   - package.json
   - vite.config
   - tailwind.config
   - tsconfig
   - App.tsx
   - main.tsx
   - layouts
   - pages
   - components
   - lib
   - data
   - assets
   - estilos
   - rutas
3. Comprende completamente el mockup actual.
4. No destruyas nada.
5. No cambies la identidad visual HUAP.
6. No elimines rutas existentes.
7. Genera diagnóstico técnico.
8. Genera plan de migración.
9. Continúa automáticamente.

## OBJETIVO

Transformar InnovaHUAP 360 desde mockup React a plataforma productiva completa.

### Portal público
/
/quienes-somos
/politica
/portafolio
/observatorio
/conocimiento
/eventos
/postula

### Plataforma interna
/login
/recuperar-password
/restablecer-password/:token

/app
/app/portafolio
/app/actas
/app/factibilidad
/app/gantt
/app/conocimiento
/app/comunicaciones
/app/innovaia
/app/ejecutivo

### Administración
/app/admin
/app/admin/contenido-publico
/app/admin/usuarios
/app/admin/roles
/app/admin/configuracion
/app/admin/auditoria

## STACK DEFINITIVO

Frontend:
- React 18
- TypeScript
- Vite
- Tailwind
- React Router
- React Hook Form
- Zod
- Axios
- TanStack Query

Backend:
- NestJS
- TypeScript
- REST API
- JWT
- Refresh Tokens
- Argon2
- Helmet
- Rate Limit
- Swagger solo local

Base de datos:
- PostgreSQL
- Prisma ORM

Infraestructura:
- Docker
- Docker Compose
- Nginx Reverse Proxy
- HTTPS Ready

## ADMINISTRACIÓN DE CONTENIDO

Todo el contenido público debe administrarse desde interfaz web:

- Home
- Quiénes somos
- Política
- Portafolio
- Observatorio
- Conocimiento
- Eventos
- Noticias
- Banners
- Imágenes

CRUD completo, publicar/despublicar, destacar y ordenar.

## SEGURIDAD

Implementar OWASP:

- Argon2
- JWT seguro
- Refresh Tokens
- Rate Limiting
- Helmet
- CSP
- HSTS
- CORS restrictivo
- Validación DTO
- Sanitización
- Auditoría
- Logs seguros

Nunca:
- Guardar contraseñas.
- Guardar secretos.
- Exponer PostgreSQL.
- Exponer Swagger en producción.

## MÓDULOS BACKEND

auth
users
roles
permissions
public-content
projects
minutes
feasibility
gantt
knowledge
communications
dashboard
uploads
audit
mail
settings
health
innovaia

## BASE DE DATOS

Tablas mínimas:

users
roles
permissions
role_permissions
refresh_tokens
password_reset_tokens
public_content
projects
project_tasks
minutes
agreements
feasibility
knowledge_items
communications
uploads
audit_logs
settings

## CORREO

Implementar SMTP:

SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
SMTP_FROM

Recuperación de contraseña segura con token de un solo uso.

## DOCKER

Crear:

- Dockerfile frontend
- Dockerfile backend
- docker-compose.yml
- docker-compose.prod.yml

Servicios:

- frontend
- backend
- postgres
- nginx
- mailhog (local)

## GIT

Preparar:

- .gitignore
- README
- docs/
- .env.example

No hacer git push automático.

## EJECUCIÓN SECUENCIAL OBLIGATORIA

Fase 1: Auditoría
Fase 2: Diagnóstico
Fase 3: Plan de migración
Fase 4: Backend NestJS
Fase 5: PostgreSQL + Prisma
Fase 6: Autenticación
Fase 7: Roles y permisos
Fase 8: Administración de contenido
Fase 9: APIs
Fase 10: Integración Frontend
Fase 11: Correo
Fase 12: InnovaIA
Fase 13: Dockerización
Fase 14: Hardening de seguridad
Fase 15: QA
Fase 16: Documentación
Fase 17: Git Ready
Fase 18: Preproducción
Fase 19: Checklist Producción
Fase 20: Validación final

Después de cada fase, generar resumen técnico y continuar automáticamente.

## CRITERIO FINAL

El proyecto termina únicamente cuando:

- Frontend conectado al backend.
- PostgreSQL funcionando.
- Docker funcionando.
- Login funcionando.
- Recuperación de contraseña funcionando.
- Administración de contenido funcionando.
- Roles funcionando.
- Auditoría funcionando.
- Documentación completa.
- Git preparado.
- Preproducción funcional.
- Listo para producción.
