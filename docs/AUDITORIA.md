# Auditoría técnica — Estado inicial (Fase 0-1)

Fecha: 2026-06-20

## Qué existe hoy

Proyecto **100% frontend**, sin backend, sin base de datos, sin Docker, sin
control de versiones previo (se inicializó git en esta fase).

- **Stack:** React 18.3 + TypeScript 5.6 + Vite 5.4 + Tailwind 3.4 + React
  Router 6.28 + lucide-react. Sin gestor de estado de servidor, sin formularios,
  sin validación, sin cliente HTTP (no hay `axios`/`fetch` a ningún API).
- **Datos:** 100% mock, hardcodeados en `src/data/app.ts` y `src/data/public.ts`
  (arrays/objetos TypeScript). No hay persistencia.
- **Rutas existentes** (todas ya implementadas como vistas, sin lógica real):
  - Público: `/`, `/quienes-somos`, `/politica`, `/portafolio`, `/observatorio`,
    `/conocimiento`, `/eventos`, `/postula`.
  - Interno bajo `/app`: dashboard, portafolio (kanban), actas, factibilidad,
    gantt, conocimiento interno, comunicaciones, innovaIA, ejecutivo.
  - **No existen** `/login`, `/recuperar-password`, `/restablecer-password/:token`
    ni ninguna ruta de administración (`/app/admin/*`) — hay que crearlas.
- **Layouts:** `PublicLayout` (header + drawer móvil + footer) y `AppLayout`
  (sidebar + topbar). Ambos sólidos, reutilizables, no requieren rediseño.
- **Identidad visual:** tokens en `src/index.css` vía CSS vars (`--accent`
  rojo HUAP `#ed1d25`, alternable a azul vía `data-accent="blue"`), expuestos a
  Tailwind en `tailwind.config.ts`. **No se debe tocar.**
- **Acceso interno actual:** el botón "Acceso Comité" navega directo a `/app`
  sin autenticación — es la brecha de seguridad más obvia a resolver.
- **Sin:** backend, ORM, base de datos, Docker, CI, tests, `.env`, manejo de
  sesión/usuario real, RBAC, auditoría, CMS para contenido público.

## Riesgos detectados

| Riesgo | Detalle | Mitigación |
|---|---|---|
| Acceso no autenticado a `/app` | Cualquiera entra a la plataforma interna | Fase 6: guard de auth + redirect a `/login` |
| Datos mock embebidos en frontend | Migrar a API sin romper la UI visualmente | Mantener misma forma de datos (shape) en los DTO de respuesta |
| Ningún `.env`/secретos | Hay que crearlos sin commitear valores reales | `.env.example` versionado, `.env` ignorado |
| Proyecto nunca instalado (`npm install`) | No hay `node_modules`, no se ha buildeado nunca | Validar build en Fase 15 (QA) |
| Carpeta `public/` exponía `CLAUDE_MASTER_PROMPT_INNOVAHUAP360.md` | Se serviría como archivo estático público | Movido a `docs/` (fuera de los assets públicos) |

## Decisión de reestructuración (ya ejecutada)

Se migró de proyecto plano a **monorepo**:

```
innovahuap360-react/
├─ frontend/   ← todo el código React anterior (sin cambios de contenido)
├─ backend/    ← NestJS (nuevo)
├─ docs/       ← documentación técnica + prompt maestro
└─ docker-compose.yml, .env.example, README.md (nuevos, en raíz)
```

Todos los archivos se movieron con `git mv` (historial preservado), **ningún
archivo de código fue modificado** en este paso. Commit de respaldo creado
antes de mover nada.

Ver [`PLAN_MIGRACION.md`](./PLAN_MIGRACION.md) para el plan de las fases
siguientes.
