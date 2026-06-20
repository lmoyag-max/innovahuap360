# Auditoría funcional de la plataforma interna — InnovaHUAP 360

Fecha: 2026-06-20 · Alcance: los 9 módulos internos del mockup (`/app/*`) + propuesta de 2 módulos
nuevos (Banco de Ideas, Pipeline de Innovación). Administración y Auditoría **ya existen y están
operativos** (ver `frontend/src/pages/admin/*`, `backend/src/audit`) — se describen al final solo
como evolución, no como construcción desde cero.

## Hallazgo transversal (antes de entrar módulo por módulo)

Las 9 páginas internas (`Dashboard`, `Portafolio`, `Actas`, `Factibilidad`, `Gantt`,
`ConocimientoInterno`, `Comunicaciones`, `InnovaIA`, `Ejecutivo`) son **100 % presentación sin
datos reales**: cada una importa arrays fijos desde `frontend/src/data/app.ts` y no hace ninguna
llamada de red. Ningún botón (`Nuevo`, `Enviar al Comité`, `Exportar PDF`, `Nueva` acta, envío del
chat de InnovaIA) ejecuta una acción real — son `preventDefault()` o `setState` puramente local.

Lo que **cambia el diagnóstico** respecto a un mockup típico: el backend NestJS ya implementado en
fases previas (`backend/src/projects`, `minutes`, `knowledge`, `communications`, `dashboard`,
`innovaia`) **ya cubre la mayoría de las operaciones CRUD** que estos módulos necesitan. El gap
real no es "construir el backend desde cero" sino:

1. **Conectar el frontend** a las APIs ya existentes (most módulos).
2. **Enriquecer el modelo de datos** donde el CRUD básico no alcanza para un proceso de gestión de
   innovación real (factibilidad ponderada y trazable, gobernanza de etapas con quórum/aprobación,
   campañas con métricas reales en el tiempo, IA con memoria de conversación).
3. **Construir 2 módulos genuinamente nuevos**: Banco de Ideas (la entrada del embudo) y Pipeline
   de Innovación como capa de gobernanza explícita sobre `Project`.

---

## 1. Dashboard General

| Dimensión | Hallazgo |
|---|---|
| Componentes existentes | KPIs (4 tarjetas), barra de progreso por etapa, lista de riesgos críticos, próximas reuniones, acuerdos pendientes, actividad reciente |
| Solo visual | El 100 %. Datos de `comiteKpis`, `etapas`, `riesgos`, `reuniones`, `acuerdos`, `actividad` |
| Falta | Conexión a `GET /api/dashboard/overview` (ya existe y devuelve KPIs reales, distribución por etapa, top riesgos, próximos acuerdos). Falta el módulo de **reuniones** (no existe tabla `meetings` — hoy son 3 filas fijas) y un feed de **actividad** real (requiere un stream de eventos, hoy solo existe `audit_logs` genérico) |
| Oportunidades | Filtros por rango de fecha; widget configurable por rol (un coordinador ve todo, un miembro solo sus proyectos); enlazar cada tarjeta a su módulo de detalle |
| Tablas necesarias | `meetings` (nueva, ver Pipeline/Gobernanza) — `audit_logs` ya cubre actividad si se filtra por acciones relevantes de UI |
| APIs necesarias | Ya existe `GET /dashboard/overview`. Falta `GET /meetings/upcoming` |
| Permisos | `dashboard.read` (ya existe) |
| Indicadores | Proyectos activos, pilotos en curso, riesgos críticos, % acuerdos cumplidos, tendencia trimestral (nuevo: requiere series históricas, no solo el valor actual) |
| Riesgos técnicos | Ninguno bloqueante; riesgo de "vista vacía" si la BD recién se desplegó sin datos — necesita estados vacíos diseñados, no solo placeholders |

**Versión productiva:** el dashboard se convierte en la portada operativa diaria — agrega
selector de periodo, tarjetas con drill-down (clic en "riesgos críticos" → filtra Portafolio),
y un feed de actividad real basado en auditoría filtrada por entidad (proyectos, actas, ideas).

---

## 2. Portafolio (Kanban)

| Dimensión | Hallazgo |
|---|---|
| Componentes existentes | Tablero Kanban de 8 columnas (Idea→Cierre), tarjetas con owner, sponsor, riesgo, KPI, fecha |
| Solo visual | 100 %. `kanban` fijo; sin drag&drop real, botón "Nuevo" no abre nada |
| Falta | Conectar a `GET/POST/PATCH /api/projects` (ya existen). Falta **drag & drop** para cambiar de etapa (`PATCH /projects/:id` con `stage`), falta **detalle de proyecto** (panel lateral con tareas, factibilidad, acuerdos vinculados — ya hay datos vía `GET /projects/:id`) |
| Oportunidades | Filtros por categoría/sponsor/riesgo; vista lista además de Kanban (accesibilidad); límite de WIP por columna; historial de cambios de etapa (auditable) |
| Tablas necesarias | Ya existen (`projects`, `project_tasks`, `feasibility`). Se sugiere agregar `project_stage_history` para trazabilidad de cuánto tiempo pasa cada proyecto en cada etapa (KPI de ciclo) |
| APIs necesarias | Ya existen CRUD; falta endpoint específico `PATCH /projects/:id/stage` que registre el cambio en `project_stage_history` y dispare auditoría |
| Permisos | `projects.read` / `projects.manage` (ya existen) |
| Indicadores | Tiempo promedio por etapa, tasa de conversión idea→piloto→escalamiento, proyectos estancados (>X días sin cambio de etapa) |
| Riesgos técnicos | Drag&drop con `react-dnd`/`@dnd-kit` agrega una dependencia nueva; debe revalidarse contra `PermissionsGuard` (un `lector` no debería poder arrastrar) |

**Versión productiva:** Kanban interactivo con drag&drop que llama a `PATCH .../stage`, panel de
detalle deslizante por tarjeta, y un indicador de "días en esta etapa" visible en cada tarjeta.

---

## 3. Actas

| Dimensión | Hallazgo |
|---|---|
| Componentes existentes | Lista de actas + detalle (participantes, acuerdos, compromisos) |
| Solo visual | 100 %. `actas`, `actaParticipantes`, `actaAcuerdos`, `actaCompromisos` fijos |
| Falta | Conectar a `GET/POST /api/minutes` y `/minutes/:id/agreements` (ya existen). Falta **"Exportar PDF"** real (requiere un generador de PDF en backend — no implementado), falta **vincular acta a proyectos** (ya existe la tabla `minute_projects` pero no hay endpoint ni UI) |
| Oportunidades | Editor de actas con plantilla institucional; firma electrónica simple (registro de quién aprueba el acta, no firma criptográfica); recordatorios automáticos de acuerdos vencidos (requiere `mail` + cron) |
| Tablas necesarias | Ya existen (`minutes`, `agreements`, `minute_projects`). Falta `minute_attendees` normalizada (hoy `attendeeInitials` es un array de texto, no referencia a `users`) |
| APIs necesarias | Exponer `POST /minutes/:id/projects` (vincular), `GET /minutes/:id/export.pdf` (nuevo, requiere `pdf-lib`/`puppeteer`) |
| Permisos | `minutes.read` / `minutes.manage` (ya existen) |
| Indicadores | % de acuerdos cumplidos a tiempo, acuerdos vencidos por responsable, asistencia promedio |
| Riesgos técnicos | Generación de PDF en el backend agrega dependencia pesada (Puppeteer); evaluar alternativa liviana (`pdfmake`) para no inflar la imagen Docker |

**Versión productiva:** acta vinculada a proyectos reales, acuerdos con notificación automática de
vencimiento por correo, exportación a PDF con la identidad institucional.

---

## 4. Factibilidad

| Dimensión | Hallazgo |
|---|---|
| Componentes existentes | Wizard de 4 pasos (solo visual, no navega), 6 criterios con barra de progreso, puntaje global en gráfico de anillo, botón "Enviar al Comité" |
| Solo visual | 100 %. `factSteps`, `factCriterios`, `factTotal` fijos; el wizard no cambia de paso |
| Falta | Conectar a `PUT /api/projects/:id/feasibility` (ya existe, pero hoy solo permite reemplazar la lista completa de criterios, no un flujo guiado paso a paso). Falta **plantilla de criterios institucional** (hoy cualquiera puede inventar el nombre del criterio — debería ser una lista fija ponderada definida por el Comité) y falta **el flujo real de envío** ("Enviar al Comité" no dispara nada) |
| Oportunidades | Convertir los 6 criterios en una **plantilla configurable con pesos** (Impacto 25 %, Factibilidad técnica 20 %, etc.) gestionada desde Administración; el puntaje global se calcula server-side, no se inventa en el frontend; estado del envío (`borrador → enviado → revisado → aprobado/rechazado`) |
| Tablas necesarias | Ampliar `feasibility`: agregar `weight` (peso del criterio) y una tabla nueva `feasibility_templates` (criterios estándar reutilizables) + `feasibility_submissions` (estado del envío, quién y cuándo aprobó) |
| APIs necesarias | `GET /feasibility-templates`, `POST /projects/:id/feasibility/submit`, `PATCH /projects/:id/feasibility/review` (aprobar/rechazar — solo coordinador/admin) |
| Permisos | `projects.manage` para editar criterios propios; nuevo permiso `feasibility.review` (aprobar/rechazar, distinto de solo registrar) |
| Indicadores | Tiempo promedio de evaluación, % de ideas que pasan el umbral de factibilidad, criterio que más reprueba ideas (para mejorar la convocatoria) |
| Riesgos técnicos | El cálculo del puntaje ponderado debe vivir en el backend (hoy `factTotal` está hardcodeado en el frontend) para evitar manipulación y duplicación de lógica |

**Versión productiva:** ficha de factibilidad con plantilla institucional ponderada, flujo de envío
y aprobación con estado explícito, y puntaje calculado de forma centralizada y auditable.

---

## 5. Carta Gantt

| Dimensión | Hallazgo |
|---|---|
| Componentes existentes | Gantt horizontal con 6 hitos, meses Jun–Nov, barras de avance |
| Solo visual | 100 %. `ganttMonths`, `ganttRows` fijos; sin edición |
| Falta | Conectar a `GET/POST/PATCH /api/projects/:id/tasks` (ya existen). Falta **edición de fechas/avance** (arrastrar barra o formulario), falta **dependencias entre tareas** (hoy `ProjectTask` no tiene relación tarea→tarea), falta **ruta crítica** |
| Oportunidades | Vista de Gantt por **portafolio completo** (no solo un proyecto) para la Oficina de Proyectos; alertas de hitos en riesgo (avance < tiempo transcurrido) |
| Tablas necesarias | Agregar `task_dependencies` (predecessor/successor) si se quiere ruta crítica real; si no, el modelo actual de `project_tasks` (offset + duración + % avance) ya alcanza para un Gantt simple |
| APIs necesarias | Ya existen CRUD de tareas. Falta `GET /projects/:id/tasks/critical-path` (si se implementan dependencias) |
| Permisos | `projects.manage` (ya existe) |
| Indicadores | Desviación de cronograma (planificado vs. real), hitos en riesgo, % avance ponderado del proyecto |
| Riesgos técnicos | Un Gantt editable con dependencias es una librería de UI no trivial (`dhtmlx-gantt`, `frappe-gantt` o construir a mano); decidir alcance antes de comprometer fecha |

**Versión productiva (alcance recomendado, sin sobreingeniería):** mantener el modelo simple
(offset + duración + avance), conectar a datos reales y permitir edición de avance vía formulario;
posponer dependencias/ruta crítica a una iteración futura si no hay demanda real del Comité.

---

## 6. Conocimiento (interno)

| Dimensión | Hallazgo |
|---|---|
| Componentes existentes | Buscador (no funcional), 6 carpetas con contador, lista de "recientes" |
| Solo visual | 100 %. `conocFolders`, `conocRecientes` fijos |
| Falta | Conectar a `GET /api/knowledge` (ya existe, con filtro por `folder`). Falta **subida real de archivos** (ya existe `POST /uploads` con validación de magic bytes — falta vincularlo a `KnowledgeItem.fileUrl`), falta **búsqueda real** (hoy el input no filtra nada) |
| Oportunidades | Versionado de documentos (un mismo conocimiento con histórico de versiones); control de acceso por carpeta (no todo "Conocimiento" debería ser visible para todos los roles) |
| Tablas necesarias | El modelo `KnowledgeItem` ya tiene `folder` como string libre; para folders reales con conteo consistente conviene una tabla `knowledge_folders` (hoy el conteo en la UI es manual/fijo) |
| APIs necesarias | Ya existe `GET/POST/PATCH/DELETE /knowledge`. Falta `GET /knowledge?search=` (full-text simple) y `GET /knowledge/folders` (conteo real) |
| Permisos | `knowledge.read` / `knowledge.manage` (ya existen) |
| Indicadores | Documentos más descargados (`downloads` ya existe en el modelo), carpetas con más actividad |
| Riesgos técnicos | Full-text search en Postgres es viable sin librerías nuevas (`tsvector`); no se requiere Elasticsearch para este volumen |

**Versión productiva:** carpetas reales con conteo dinámico, subida de archivos conectada a
`uploads`, búsqueda con `tsvector` de Postgres.

---

## 7. Comunicaciones

| Dimensión | Hallazgo |
|---|---|
| Componentes existentes | 4 métricas, calendario editorial semanal, lista de campañas con estado |
| Solo visual | 100 %. `comMetrics`, `comCalendar`, `comCampanas` fijos |
| Falta | Conectar a `GET/POST/PATCH /api/communications` (ya existe, con `metrics: Json` y `scheduledAt`). Falta **vista de calendario real** (agrupar por fecha), falta **métricas que se acumulen con el tiempo** (hoy `metrics` es un blob JSON sin histórico) |
| Oportunidades | Integración real con un proveedor de envío (Mailchimp/Brevo) para que "lectores del boletín" no sea un número inventado; biblioteca de plantillas de comunicación |
| Tablas necesarias | Agregar `communication_metrics_snapshots` (fecha + métrica) si se quiere graficar tendencia real en vez de un único JSON mutable |
| APIs necesarias | Ya existen CRUD. Falta `GET /communications/calendar?month=` |
| Permisos | `communications.read` / `communications.manage` (ya existen) |
| Indicadores | Tasa de apertura real (requiere integración con proveedor de correo), alcance por canal, campañas activas vs. planificadas |
| Riesgos técnicos | Sin integración con un ESP real, las métricas de "lectores"/"alcance" seguirán siendo manuales — decisión consciente: ¿se ingresan a mano o se conecta un proveedor? Impacta el diseño del modelo |

**Versión productiva:** calendario editorial real agrupado por fecha desde `scheduledAt`, métricas
con snapshot temporal para graficar tendencia, sin pretender una integración de email marketing que
no está en el alcance actual.

---

## 8. InnovaIA

| Dimensión | Hallazgo |
|---|---|
| Componentes existentes | Chat con burbujas, accesos rápidos ("Generar un acta", etc.), tarjeta de ficha generada |
| Solo visual | 100 %. Conversación hardcodeada (`initial`); el envío de mensajes solo agrega una respuesta genérica de "demostración" |
| Falta | Conectar a `POST /api/innovaia/ask` (ya existe — responde 503 claro si no hay proveedor configurado, o llama a Anthropic si `INNOVAIA_PROVIDER=anthropic`). Falta **persistencia de la conversación** (hoy cada `ask` es independiente, sin memoria ni historial guardado) |
| Oportunidades | Dar contexto real a la IA (inyectar datos del portafolio/dashboard en el prompt para respuestas basadas en datos reales del Comité, no genéricas); acciones estructuradas (que la IA pueda *proponer* una ficha de proyecto que el usuario confirma y se crea de verdad via `POST /projects`, no solo texto) |
| Tablas necesarias | Nueva `ia_conversations` + `ia_messages` (historial por usuario) |
| APIs necesarias | `GET/POST /innovaia/conversations`, `POST /innovaia/conversations/:id/messages` |
| Permisos | `innovaia.use` (ya existe) |
| Indicadores | Uso por usuario/mes, tipo de solicitud más frecuente (acta, ficha, KPI, resumen) |
| Riesgos técnicos | Costo y latencia de la API de IA real; **nunca** enviar datos de pacientes/clínicos sensibles en el prompt sin anonimizar — debe quedar explícito en una política de uso |

**Versión productiva:** chat conectado de verdad a `/innovaia/ask` con historial persistido,
accesos rápidos que envían un prompt estructurado por tipo de tarea, y una advertencia visible de
qué datos no deben compartirse con el asistente.

---

## 9. Dashboard Ejecutivo

| Dimensión | Hallazgo |
|---|---|
| Componentes existentes | 4 KPIs financiero/impacto, gráfico de barras "impacto por ámbito", indicadores estratégicos con barra de progreso |
| Solo visual | 100 %. `ejecKpis`, `ejecImpacto`, `ejecLineas` fijos |
| Falta | Conectar a `GET /api/dashboard/executive` (ya existe — combina conteos reales de proyectos/pilotos/riesgos con `curatedKpis` editables desde `/app/admin/configuracion`, clave `executive_kpis`). El admin ya puede curar estos KPIs; **falta que esta página los muestre** |
| Oportunidades | Exportar el dashboard ejecutivo a PDF/PPT para presentación a Dirección; comparación periodo vs. periodo anterior |
| Tablas necesarias | Ya existe (`settings` para KPIs curados); para series históricas reales se sugiere `executive_kpi_history` (snapshot mensual) en vez de un único JSON que se sobrescribe |
| APIs necesarias | Ya existe `GET /dashboard/executive`. Falta `GET /dashboard/executive/history?from=&to=` si se quiere tendencia |
| Permisos | `dashboard.read` (ya existe) |
| Indicadores | Los que ya están curados (beneficio estimado, beneficiarios, etc.) + tendencia interanual real |
| Riesgos técnicos | Ninguno — es el módulo con menos brecha real, solo falta el "último cable": conectar la página a la API que ya existe |

**Versión productiva:** la misma vista, alimentada por datos reales + KPIs curados, con exportación
a PDF para sesiones de Dirección.

---

## Módulos nuevos

### 10. Banco de Ideas

El portal público ya tiene un formulario de postulación (`/postula`) que **no envía nada** —
es el punto de entrada natural para este módulo.

| Dimensión | Detalle |
|---|---|
| Visión | Embudo formal de captura de ideas: cualquier funcionario o usuario postula → el Comité triagea → la idea aprobada se **convierte en `Project`** (etapa `IDEA`) sin perder trazabilidad de origen |
| Tablas | `ideas` (título, descripción, proponente, unidad, ámbito, estado, votos, proyecto resultante si aplica) |
| Estados | `RECIBIDA → EN_TRIAGE → APROBADA → CONVERTIDA_A_PROYECTO` / `RECHAZADA` |
| APIs | `POST /public/ideas` (público, con rate limiting estricto y captcha-lite anti-spam), `GET /ideas` (admin), `PATCH /ideas/:id/triage`, `POST /ideas/:id/convert-to-project` |
| Permisos | nuevo `ideas.read` / `ideas.manage` |
| Indicadores | Ideas recibidas por mes, tasa de conversión a proyecto, ámbito con más postulaciones, tiempo promedio de triage |
| Riesgos | Es un formulario público sin autenticación → vector de spam/abuso; requiere rate limiting agresivo (ya existe `ThrottlerModule`) + validación estricta + revisión manual obligatoria antes de publicar nada |

### 11. Pipeline de Innovación (gobernanza de etapas)

No es una tabla nueva de proyectos (`Project` ya modela el pipeline) sino una **capa de gobernanza**
sobre el modelo existente: quién puede mover un proyecto de etapa, qué se exige para avanzar
(ej. no se puede pasar a "Piloto" sin factibilidad aprobada), y el historial de tránsito.

| Dimensión | Detalle |
|---|---|
| Tablas | `project_stage_history` (de qué etapa a cuál, quién, cuándo, motivo) + `stage_gates` (reglas: "Piloto requiere feasibility.approved = true") |
| APIs | `PATCH /projects/:id/stage` (valida las reglas de `stage_gates` antes de permitir el cambio; si no cumple, devuelve 409 con el motivo) |
| Permisos | reutiliza `projects.manage`; un gate puede exigir además `feasibility.review` |
| Indicadores | Tiempo de ciclo por etapa, proyectos bloqueados por incumplir un gate, etapa con más fricción |
| Riesgos | Si las reglas de gate son demasiado rígidas, frena la operación real del Comité — deben ser configurables desde Administración, no hardcodeadas |

---

## Matriz de permisos consolidada (nuevos permisos a agregar al seed)

| Permiso | Módulo |
|---|---|
| `ideas.read` / `ideas.manage` | Banco de Ideas |
| `feasibility.review` | Factibilidad (aprobar/rechazar, distinto de solo registrar) |

El resto de los permisos necesarios (`projects.*`, `minutes.*`, `knowledge.*`,
`communications.*`, `dashboard.read`, `innovaia.use`) **ya existen** desde el seed actual.

## Priorización recomendada de implementación

1. **Conectar lo que ya tiene API** (Dashboard, Portafolio, Actas, Conocimiento, Comunicaciones,
   Dashboard Ejecutivo) — es el mayor impacto con el menor riesgo, porque el backend ya está
   probado.
2. **Banco de Ideas** — módulo nuevo autocontenido, cierra el círculo con `/postula` que hoy es
   un formulario muerto.
3. **Factibilidad con plantilla ponderada y flujo de aprobación** — requiere cambios de modelo
   más profundos.
4. **Pipeline de Innovación (gates)** — depende de que Factibilidad ya tenga estado de aprobación.
5. **InnovaIA con historial real** y **Gantt editable** — mayor esfuerzo de UI, menor urgencia.

Este documento es la base de la implementación progresiva que continúa en los commits
siguientes, módulo por módulo, sin alterar la identidad visual ni destruir el mockup existente.

## Addendum — estado de implementación (2026-06-20)

Lo descrito en este documento ya fue construido e integrado en el código:

- Los 9 módulos internos quedaron conectados a las APIs reales (ver commit "feat: conectar
  los 9 modulos internos a las APIs reales"). Ya no existe dato mock en `/app/*`.
- **Banco de Ideas** quedó implementado de punta a punta: modelo `Idea` + enum `IdeaStatus`
  (`backend/prisma/schema.prisma`), endpoint público `POST /public/ideas` (con
  `@Throttle` de 5 req/min, igual criterio que las rutas sensibles de `auth`), endpoints
  internos `GET/PATCH /ideas` y `POST /ideas/:id/convert-to-project` (`backend/src/ideas/`),
  permisos `ideas.read`/`ideas.manage` en el seed, página pública `/postula` ahora envía
  datos reales, y nueva página interna `/app/ideas` para el triage del Comité.
- **Pipeline de Innovación**: se implementó como capa de gobernanza sobre `Project`, no como
  un módulo aparte. Nuevo modelo `ProjectStageHistory` (trazabilidad de quién/cuándo/desde-hacia
  qué etapa) y endpoint `PATCH /projects/:id/stage` que valida un primer gate explícito —no se
  puede avanzar a Piloto/Implementación/Escalamiento sin al menos una evaluación de factibilidad
  registrada— devolviendo 409 con el motivo si no se cumple. El cambio de etapa desde el
  Kanban de Portafolio pasa ahora por esta ruta en vez de un PATCH genérico. Gates adicionales
  configurables desde Administración quedan como siguiente iteración natural, no construida en
  este pase para evitar una capa de configuración sin un caso de uso real que la exija todavía.
- **Administración** y **Auditoría** no se tocaron — ya eran funcionales desde fases anteriores.

## Addendum 2 — evolución del Banco de Ideas al formulario oficial (2026-06-20)

A petición explícita del Comité, el Banco de Ideas descrito arriba (versión mínima: nombre,
unidad libre, descripción, ámbito) se **evolucionó** —no se reconstruyó— al formulario oficial
de postulación con ficha técnica. Cambios sobre lo ya existente:

- **`Idea` ampliado** (misma tabla `ideas`, no se duplicó): cargo, correo, teléfono, unidad como
  FK a una tabla maestra nueva (`units`), tipo de proyecto (Gestión Clínica / Administrativa /
  Académico I+D+i), etapa declarada por el postulante, aprobación de jefatura (Sí/No) y ficha
  técnica obligatoria (FK única a `uploads`). El campo libre `scope` (Clínico/Gestión/Digital/…)
  se reemplazó por `projectType`, que es la clasificación oficial del Comité.
- **`units`**: tabla maestra que reemplaza listas estáticas, cargada con el listado institucional
  HUAP completo (deduplicado: varios servicios se repetían en el organigrama original bajo más
  de una subdirección). CRUD en Administración → Unidades y Servicios, con activar/inactivar e
  importación masiva desde Excel (`POST /admin/units/import-excel`).
- **Ficha técnica real**: `GET /public/ideas/ficha-tecnica/template` genera un `.docx` editable
  (librería `docx`) con las secciones oficiales (problema, solución, impacto, riesgos). El
  postulante la descarga, completa y la vuelve a subir (`POST /public/ideas/upload-ficha`,
  DOC/DOCX/PDF validados por magic bytes reales) antes de poder enviar la postulación.
- **Estados ampliados**: `IdeaStatus` pasó de 5 a 8 valores (Recibida → En revisión ⇄ Observada →
  Factibilidad → Aprobada/Rechazada → En ejecución → Cerrada), con `idea_status_history`
  append-only trazando cada transición (quién, cuándo, nota).
- **Comentarios del Comité** (`idea_comments`), auditados en `audit_logs` y notificados por
  correo al postulante.
- **`committee_members`**: en vez de duplicar `users`, es una tabla de relación (1 fila por
  usuario suscrito a notificaciones), gestionable desde Administración → Usuarios.
- **Notificaciones SMTP** reutilizando `MailService`/Mailhog ya configurado: al postulante al
  recibir la idea y en cada cambio de estado/observación; al Comité completo al recibir una idea
  nueva. No bloquean el flujo si el SMTP falla.
- **Dashboards**: `GET /dashboard/overview` y `GET /dashboard/executive` ahora incluyen
  indicadores de ideas (total, por estado, por servicio, por tipo, tendencia mensual, servicios
  con más postulaciones) además de los ya existentes de portafolio.

Validado de extremo a extremo en el stack Docker reconstruido: descarga de ficha → carga →
postulación pública → triage (revisión, observación, factibilidad) → comentario → aprobación →
conversión a proyecto, con notificaciones reales en Mailhog en cada paso e importación de
unidades desde un Excel real. Datos de prueba eliminados tras la verificación.
