# INNOVAHUAP 360 — Plataforma del Comité de Innovación

Portal web responsive del Comité de Innovación del **Hospital de Urgencia Asistencia Pública (HUAP — Posta Central)**. Combina un **portal público** de innovación con una **plataforma interna** de gestión (dashboards, portafolio, actas, factibilidad, Gantt, conocimiento, comunicaciones e InnovaIA).

Construido con **React 18 + TypeScript + Vite + Tailwind CSS** y **React Router**.

> Eslogan: _"Transformando ideas en impacto para la salud pública"._

---

## Requisitos

- **Node.js 18+** (recomendado 20+)
- npm 9+ (o pnpm/yarn equivalente)

## Puesta en marcha

```bash
npm install      # instala dependencias
npm run dev      # arranca el servidor de desarrollo (http://localhost:5173)
```

Otros comandos:

```bash
npm run build    # compila TypeScript y genera el build de producción en /dist
npm run preview  # sirve el build de producción localmente
```

## Abrir en Visual Studio Code

1. `File ▸ Open Folder…` y elige la carpeta `innovahuap360-react`.
2. Abre una terminal integrada (`Ctrl/Cmd + ñ`) y ejecuta `npm install` y luego `npm run dev`.
3. Extensiones recomendadas: **ESLint**, **Tailwind CSS IntelliSense**, **Prettier**.

---

## Estructura del proyecto

```
innovahuap360-react/
├─ public/
│  ├─ logo.png            # Logotipo HUAP
│  └─ fondo.jpg           # Imagen del edificio (hero)
├─ src/
│  ├─ main.tsx            # Punto de entrada (BrowserRouter)
│  ├─ App.tsx             # Definición de rutas (público + interno)
│  ├─ index.css           # Tailwind + tokens de diseño (CSS variables)
│  ├─ lib/
│  │  └─ nav.ts           # Configuración de navegación (público y sidebar)
│  ├─ data/
│  │  ├─ public.ts        # Datos del portal público (tipados)
│  │  └─ app.ts           # Datos de la plataforma interna (tipados)
│  ├─ components/
│  │  ├─ Brand.tsx        # Logotipo + wordmark
│  │  ├─ PageHeader.tsx   # Cabecera de páginas públicas
│  │  └─ ui/              # Componentes reutilizables
│  │     ├─ Section.tsx   # Eyebrow, SectionTitle
│  │     ├─ Panel.tsx     # Panel, Kpi
│  │     ├─ ProgressBar.tsx
│  │     ├─ Badge.tsx     # Badge, Dot
│  │     ├─ ProjectCard.tsx
│  │     └─ index.ts      # Barrel de exportación
│  ├─ layouts/
│  │  ├─ PublicLayout.tsx # Header + menú hamburguesa + footer
│  │  └─ AppLayout.tsx    # Sidebar (drawer en móvil) + topbar
│  └─ pages/
│     ├─ public/          # 8 páginas del portal público
│     │  ├─ Home.tsx
│     │  ├─ QuienesSomos.tsx
│     │  ├─ Politica.tsx
│     │  ├─ PortafolioPublico.tsx
│     │  ├─ Observatorio.tsx
│     │  ├─ Conocimiento.tsx
│     │  ├─ Eventos.tsx
│     │  └─ Postula.tsx
│     └─ app/             # 9 páginas de la plataforma interna
│        ├─ Dashboard.tsx
│        ├─ Portafolio.tsx        # Kanban
│        ├─ Actas.tsx
│        ├─ Factibilidad.tsx
│        ├─ Gantt.tsx
│        ├─ ConocimientoInterno.tsx
│        ├─ Comunicaciones.tsx
│        ├─ InnovaIA.tsx
│        └─ Ejecutivo.tsx
├─ tailwind.config.ts
├─ vite.config.ts
└─ tsconfig*.json
```

## Rutas

| Ruta | Vista |
|------|-------|
| `/` | Inicio (portal público) |
| `/quienes-somos` · `/politica` · `/portafolio` · `/observatorio` · `/conocimiento` · `/eventos` · `/postula` | Páginas públicas |
| `/app` | Dashboard General (plataforma interna) |
| `/app/portafolio` · `/app/actas` · `/app/factibilidad` · `/app/gantt` · `/app/conocimiento` · `/app/comunicaciones` · `/app/innovaia` · `/app/ejecutivo` | Módulos internos |

El botón **"Acceso Comité"** del portal lleva a `/app`; **"Volver al portal"** regresa a `/`.

---

## Diseño responsive (Mobile First)

Breakpoints de Tailwind:

- **Mobile:** base (320–768 px) — una sola columna, menú hamburguesa, tablas/Kanban/Gantt con scroll horizontal.
- **Tablet:** `md` (≥768 px) — rejillas de 2 columnas, acciones visibles.
- **Desktop:** `lg` (≥1024 px) — navegación superior completa, sidebar fijo, rejillas de 3–5 columnas.

## Identidad visual

- **Acento de marca:** rojo institucional HUAP `#ed1d25` (definido como variable CSS `--accent`).
- **Identidad alternativa:** azul salud `#2a6fdb` — añade `data-accent="blue"` al elemento `<html>` para alternar toda la paleta sin tocar componentes.
- **Tipografía:** Hanken Grotesk (texto) + JetBrains Mono (datos, etiquetas, métricas).
- **Base neutra:** escala _slate_ fría (sistema de diseño Acervo).

Los tokens viven como variables CSS en `src/index.css` y se exponen a Tailwind en `tailwind.config.ts`.

## Iconografía

[Lucide](https://lucide.dev) vía `lucide-react`.

---

© 2026 HUAP · Posta Central · Santiago de Chile
