import { ContentSection, KnowledgeType, ProjectStage, PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes } from 'node:crypto';
import { HUAP_UNITS } from './seed-units';

const prisma = new PrismaClient();

const PERMISSIONS = [
  'users.read', 'users.manage',
  // users.delete separado de users.manage: solo admin/super_admin pueden
  // eliminar (borrado lógico) usuarios, igual patrón que ideas.delete.
  'users.delete',
  'roles.read', 'roles.manage',
  // Contenido Público: separado en 3 permisos para poder restringir
  // eliminación a administradores sin afectar quién puede crear/editar
  // o publicar/despublicar (ver public-content.controller.ts).
  'public_content.manage', 'public_content.publish', 'public_content.delete',
  'projects.read', 'projects.manage',
  // projects.tasks.delete separado de projects.manage: solo admin/super_admin
  // pueden eliminar hitos/tareas de la Carta Gantt, igual patrón que ideas.delete.
  'projects.tasks.delete',
  'minutes.read', 'minutes.manage',
  'knowledge.read', 'knowledge.manage',
  'communications.read', 'communications.manage',
  'dashboard.read',
  'uploads.manage',
  'audit.read',
  'settings.manage',
  'innovaia.use',
  // ideas.delete separado de ideas.manage: solo admin/super_admin pueden
  // eliminar/restaurar/destacar ideas, igual que public_content.delete.
  'ideas.read', 'ideas.manage', 'ideas.delete',
  'units.read', 'units.manage',
  // factibilidad.delete separado de projects.manage: solo admin/super_admin pueden
  // eliminar/restaurar fichas y evidencias de Factibilidad, igual patrón que ideas.delete.
  'factibilidad.delete',
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: PERMISSIONS,
  super_admin: PERMISSIONS,
  coordinador: [
    'projects.read', 'projects.manage',
    'minutes.read', 'minutes.manage',
    'knowledge.read', 'knowledge.manage',
    'communications.read', 'communications.manage',
    'dashboard.read', 'public_content.manage', 'public_content.publish', 'uploads.manage', 'audit.read', 'innovaia.use',
    'ideas.read', 'ideas.manage', 'units.read', 'units.manage',
  ],
  miembro_comite: [
    'projects.read', 'projects.manage',
    'minutes.read', 'minutes.manage',
    'knowledge.read', 'communications.read', 'dashboard.read', 'innovaia.use',
    'ideas.read', 'units.read',
  ],
  lector: ['projects.read', 'minutes.read', 'knowledge.read', 'communications.read', 'dashboard.read', 'ideas.read', 'units.read'],
};

const ROLE_NAMES: Record<string, string> = {
  admin: 'Administrador',
  super_admin: 'Super Administrador',
  coordinador: 'Coordinador del Comité',
  miembro_comite: 'Miembro del Comité',
  lector: 'Lector',
};

// Catálogo de módulos de navegación (capa "Acceso a Módulos", independiente
// de Permission/RolePermission). Mismo orden y agrupación que appNav en el
// frontend (frontend/src/lib/nav.ts).
const MODULES: { key: string; name: string; groupKey: string; groupLabel: string; sortOrder: number }[] = [
  { key: 'dashboard', name: 'Dashboard General', groupKey: 'gestion', groupLabel: 'Gestión', sortOrder: 1 },
  { key: 'ideas', name: 'Banco de Ideas', groupKey: 'gestion', groupLabel: 'Gestión', sortOrder: 2 },
  { key: 'projects', name: 'Proyectos', groupKey: 'gestion', groupLabel: 'Gestión', sortOrder: 3 },
  { key: 'minutes', name: 'Actas', groupKey: 'gestion', groupLabel: 'Gestión', sortOrder: 4 },
  { key: 'factibilidad', name: 'Factibilidad', groupKey: 'gestion', groupLabel: 'Gestión', sortOrder: 5 },
  { key: 'gantt', name: 'Carta Gantt', groupKey: 'gestion', groupLabel: 'Gestión', sortOrder: 6 },
  { key: 'knowledge', name: 'Conocimiento', groupKey: 'conocimiento', groupLabel: 'Conocimiento', sortOrder: 7 },
  { key: 'communications', name: 'Comunicaciones', groupKey: 'conocimiento', groupLabel: 'Conocimiento', sortOrder: 8 },
  { key: 'innovaia', name: 'InnovaIA', groupKey: 'inteligencia', groupLabel: 'Inteligencia', sortOrder: 9 },
  { key: 'executive', name: 'Dashboard Ejecutivo', groupKey: 'inteligencia', groupLabel: 'Inteligencia', sortOrder: 10 },
  { key: 'public_content', name: 'Contenido Público', groupKey: 'administracion', groupLabel: 'Administración', sortOrder: 11 },
  { key: 'users', name: 'Usuarios', groupKey: 'administracion', groupLabel: 'Administración', sortOrder: 12 },
  { key: 'units', name: 'Unidades y Servicios', groupKey: 'administracion', groupLabel: 'Administración', sortOrder: 13 },
  { key: 'roles', name: 'Roles', groupKey: 'administracion', groupLabel: 'Administración', sortOrder: 14 },
  { key: 'settings', name: 'Configuración', groupKey: 'administracion', groupLabel: 'Administración', sortOrder: 15 },
  { key: 'mail', name: 'Correo', groupKey: 'administracion', groupLabel: 'Administración', sortOrder: 16 },
  { key: 'audit', name: 'Auditoría', groupKey: 'administracion', groupLabel: 'Administración', sortOrder: 17 },
];

async function main() {
  // Limpia permisos obsoletos (ej. el antiguo "content.manage", reemplazado
  // por public_content.manage/publish/delete) para que no queden huérfanos.
  await prisma.permission.deleteMany({ where: { key: { notIn: PERMISSIONS } } });
  for (const key of PERMISSIONS) {
    await prisma.permission.upsert({ where: { key }, create: { key }, update: {} });
  }

  for (const [key, name] of Object.entries(ROLE_NAMES)) {
    const role = await prisma.role.upsert({ where: { key }, create: { key, name }, update: { name } });
    const permissions = await prisma.permission.findMany({ where: { key: { in: ROLE_PERMISSIONS[key] } } });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: role.id, permissionId: p.id })),
    });
  }

  // Catálogo de módulos: se actualiza en cada seed (metadata, no es elección
  // del administrador). La asignación rol↔módulo NO se resetea si el rol ya
  // tiene alguna fila: eso es configuración editable desde Roles → Acceso a
  // Módulos y un reseed nunca debe pisarla. Solo se siembra "todo habilitado"
  // para roles que todavía no tienen ninguna asignación (estado inicial no
  // disruptivo: el día 0 cada rol ve exactamente lo mismo que ya veía).
  for (const m of MODULES) {
    await prisma.module.upsert({
      where: { key: m.key },
      create: m,
      update: { name: m.name, groupKey: m.groupKey, groupLabel: m.groupLabel, sortOrder: m.sortOrder },
    });
  }
  const allModules = await prisma.module.findMany();
  for (const key of Object.keys(ROLE_NAMES)) {
    const role = await prisma.role.findUniqueOrThrow({ where: { key } });
    const existingCount = await prisma.roleModule.count({ where: { roleId: role.id } });
    if (existingCount === 0) {
      await prisma.roleModule.createMany({
        data: allModules.map((m) => ({ roleId: role.id, moduleId: m.id })),
      });
    }
  }

  const uniqueUnitNames = [...new Set(HUAP_UNITS.map((n) => n.trim()).filter(Boolean))];
  for (const name of uniqueUnitNames) {
    await prisma.unit.upsert({ where: { name }, create: { name }, update: {} });
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@innovahuap.local';
  let existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const adminPassword = process.env.ADMIN_PASSWORD ?? randomBytes(12).toString('base64url');
    const adminRole = await prisma.role.findUniqueOrThrow({ where: { key: 'admin' } });

    existingAdmin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: await argon2.hash(adminPassword),
        fullName: 'Administrador InnovaHUAP 360',
        initials: 'AD',
        roleId: adminRole.id,
        mustChangePass: true,
      },
    });

    if (!process.env.ADMIN_PASSWORD) {
      // eslint-disable-next-line no-console
      console.log('\n=== Usuario administrador creado ===');
      // eslint-disable-next-line no-console
      console.log(`Email:    ${adminEmail}`);
      // eslint-disable-next-line no-console
      console.log(`Password: ${adminPassword}  (cámbiela al iniciar sesión)`);
      // eslint-disable-next-line no-console
      console.log('=====================================\n');
    }
  }

  // El administrador queda como primer miembro del Comité para recibir las
  // notificaciones del Banco de Ideas; ajustable luego desde Administración.
  const hasCommitteeMembers = (await prisma.committeeMember.count()) > 0;
  if (!hasCommitteeMembers) {
    await prisma.committeeMember.create({ data: { userId: existingAdmin.id, isActive: true } });
  }

  // Usuario super_admin de respaldo (acceso de emergencia / soporte), con
  // contraseña temporal que obliga a cambiarla en el primer inicio de sesión.
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL ?? 'admin@innovahuap360.local';
  const existingSuperAdmin = await prisma.user.findUnique({ where: { email: superAdminEmail } });

  if (!existingSuperAdmin) {
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD ?? randomBytes(12).toString('base64url');
    const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { key: 'super_admin' } });

    await prisma.user.create({
      data: {
        email: superAdminEmail,
        passwordHash: await argon2.hash(superAdminPassword),
        fullName: 'Super Administrador InnovaHUAP 360',
        initials: 'SA',
        roleId: superAdminRole.id,
        mustChangePass: true,
      },
    });

    if (!process.env.SUPER_ADMIN_PASSWORD) {
      // eslint-disable-next-line no-console
      console.log('\n=== Usuario super_admin creado ===');
      // eslint-disable-next-line no-console
      console.log(`Email:    ${superAdminEmail}`);
      // eslint-disable-next-line no-console
      console.log(`Password: ${superAdminPassword}  (cámbiela al iniciar sesión)`);
      // eslint-disable-next-line no-console
      console.log('===================================\n');
    }
  }

  // Página pública "Quiénes Somos": migra al modelo administrable el
  // encabezado y los integrantes que hoy están hardcodeados en
  // frontend/src/data/public.ts, para que el contenido siga viéndose igual
  // apenas se despliega esta migración (continuidad, sin datos inventados).
  const ABOUT_SLUG = 'quienes-somos';
  const existingAboutContent = await prisma.publicContent.findUnique({ where: { slug: ABOUT_SLUG } });
  if (!existingAboutContent) {
    await prisma.publicContent.create({
      data: {
        section: ContentSection.QUIENES_SOMOS,
        slug: ABOUT_SLUG,
        title: 'El gobierno de la innovación del HUAP',
        excerpt:
          'El Comité de Innovación articula, prioriza y acompaña las iniciativas que mejoran la atención de urgencia. Creemos que la innovación pertenece a todos los funcionarios y usuarios del hospital.',
        isPublished: true,
        publishedAt: new Date(),
      },
    });
  }

  const hasAboutMembers = (await prisma.aboutMember.count()) > 0;
  if (!hasAboutMembers) {
    const seedMembers = [
      { name: 'Dra. Rosa Cárcamo', role: 'Coordinadora del Comité' },
      { name: 'Dr. Manuel Soto', role: 'Dirección Médica' },
      { name: 'Ing. Pablo Rivas', role: 'Transformación Digital' },
      { name: 'EU. Carolina Díaz', role: 'Humanización y Cuidados' },
      { name: 'Sr. Andrés Vera', role: 'Gestión y Calidad' },
      { name: 'Sra. Laura Pino', role: 'Comunicaciones' },
    ];
    await prisma.aboutMember.createMany({
      data: seedMembers.map((m, i) => ({ ...m, sortOrder: i, isActive: true })),
    });
  }

  // Política: encabezado + documentos descargables (metadatos migrados desde
  // el mock; sin archivo real adjunto todavía — el admin puede subirlo luego
  // desde Contenido Público → Política sin perder esta fila).
  const POLITICA_SLUG = 'politica';
  const existingPolitica = await prisma.publicContent.findUnique({ where: { slug: POLITICA_SLUG } });
  if (!existingPolitica) {
    await prisma.publicContent.create({
      data: {
        section: ContentSection.POLITICA,
        slug: POLITICA_SLUG,
        title: 'Política de Innovación',
        excerpt:
          'Biblioteca digital con la política, reglamentos, resoluciones y planes que rigen la innovación en el HUAP. Documentos abiertos a toda la comunidad.',
        isPublished: true,
        publishedAt: new Date(),
      },
    });
  }

  const hasPoliticaDocs = (await prisma.publicContent.count({ where: { section: ContentSection.POLITICA, itemType: 'DOCUMENTO' } })) > 0;
  if (!hasPoliticaDocs) {
    const politicaDocs = [
      { title: 'Política de Innovación HUAP', type: 'POLÍTICA', date: '2026', size: '2.4 MB' },
      { title: 'Reglamento del Comité de Innovación', type: 'REGLAMENTO', date: '2026', size: '1.1 MB' },
      { title: 'Resolución de constitución', type: 'RESOLUCIÓN', date: '2025', size: '480 KB' },
      { title: 'Plan de trabajo 2026–2027', type: 'PLAN', date: '2026', size: '3.2 MB' },
      { title: 'Plan comunicacional 2026–2027', type: 'PLAN', date: '2026', size: '2.8 MB' },
      { title: 'Manual de gobernanza de innovación', type: 'MANUAL', date: '2026', size: '1.9 MB' },
    ];
    for (const [i, d] of politicaDocs.entries()) {
      await prisma.publicContent.create({
        data: {
          section: ContentSection.POLITICA,
          slug: `politica-doc-${i + 1}`,
          title: d.title,
          excerpt: `${d.date} · ${d.size}`,
          category: d.type,
          itemType: 'DOCUMENTO',
          isPublished: true,
          sortOrder: i,
          publishedAt: new Date(),
        },
      });
    }
  }

  // Observatorio: artículo destacado + tendencias/casos/publicaciones.
  const hasObservatorio = (await prisma.publicContent.count({ where: { section: ContentSection.OBSERVATORIO } })) > 0;
  if (!hasObservatorio) {
    await prisma.publicContent.create({
      data: {
        section: ContentSection.OBSERVATORIO,
        slug: 'observatorio-destacado-triage-ia',
        title: 'Cómo la inteligencia artificial está redefiniendo el triage de urgencia',
        excerpt: 'Una mirada a los primeros resultados del piloto del HUAP y las tendencias internacionales en priorización clínica asistida.',
        category: 'IA EN SALUD',
        itemType: 'PUBLICACION',
        isPublished: true,
        isFeatured: true,
        sortOrder: 0,
        publishedAt: new Date('2026-06-12'),
      },
    });
    const obsArticles = [
      { cat: 'TENDENCIAS', title: '5 tecnologías que transformarán la urgencia hospitalaria', date: '2026-06-10' },
      { cat: 'CASOS DE ÉXITO', title: 'Trazabilidad en tiempo real: el caso de la Posta Central', date: '2026-06-06' },
      { cat: 'TRANSFORMACIÓN DIGITAL', title: 'Interoperabilidad: el desafío pendiente de la salud pública', date: '2026-06-02' },
      { cat: 'PUBLICACIONES', title: 'Humanización y experiencia del paciente en urgencia', date: '2026-05-28' },
    ];
    for (const [i, a] of obsArticles.entries()) {
      await prisma.publicContent.create({
        data: {
          section: ContentSection.OBSERVATORIO,
          slug: `observatorio-${i + 1}`,
          title: a.title,
          category: a.cat,
          itemType: 'TENDENCIA',
          isPublished: true,
          sortOrder: i + 1,
          publishedAt: new Date(a.date),
        },
      });
    }
  }

  // Eventos: agenda de sesiones, jornadas, capacitaciones y convocatorias.
  const hasEventos = (await prisma.publicContent.count({ where: { section: ContentSection.EVENTOS } })) > 0;
  if (!hasEventos) {
    const eventos = [
      { title: 'Sesión ordinaria del Comité de Innovación', type: 'Sesión', place: 'Sala Dirección', date: '2026-06-18T09:00:00' },
      { title: 'Demo Day · Pilotos del segundo trimestre', type: 'Jornada', place: 'Auditorio Central', date: '2026-06-25T15:00:00' },
      { title: 'Jornada de Humanización en Urgencia', type: 'Jornada', place: 'Hall principal', date: '2026-07-02T11:00:00' },
      { title: 'Capacitación: metodologías ágiles en salud', type: 'Capacitación', place: 'Sala de formación', date: '2026-07-09T14:30:00' },
      { title: 'Convocatoria: Fondo de Ideas 2026 — cierre', type: 'Convocatoria', place: 'En línea', date: '2026-07-15T23:59:00' },
    ];
    for (const [i, e] of eventos.entries()) {
      await prisma.publicContent.create({
        data: {
          section: ContentSection.EVENTOS,
          slug: `evento-${i + 1}`,
          title: e.title,
          category: e.type,
          itemType: e.type.toUpperCase(),
          eventDate: new Date(e.date),
          eventLocation: e.place,
          isPublished: true,
          sortOrder: i,
        },
      });
    }
  }

  // Conocimiento: recursos públicos migrados a `knowledge_items` (mismo
  // modelo que ya usa el módulo interno /app/conocimiento, marcados
  // isPublic=true para que aparezcan también en /conocimiento).
  const hasPublicKnowledge = (await prisma.knowledgeItem.count({ where: { isPublic: true } })) > 0;
  if (!hasPublicKnowledge) {
    const recursos: { title: string; type: KnowledgeType; downloads: number }[] = [
      { title: 'Caso de éxito: Triage digital', type: KnowledgeType.PUBLICACION, downloads: 340 },
      { title: 'Lecciones aprendidas — Pilotos 2025', type: KnowledgeType.LECCION, downloads: 210 },
      { title: 'Guía para postular una idea', type: KnowledgeType.GUIA, downloads: 1200 },
      { title: 'Presentación del Comité 2026', type: KnowledgeType.PRESENTACION, downloads: 98 },
      { title: 'Publicación: Humanización en urgencia', type: KnowledgeType.PUBLICACION, downloads: 156 },
      { title: 'Informe de impacto anual', type: KnowledgeType.INFORME, downloads: 87 },
    ];
    await prisma.knowledgeItem.createMany({
      data: recursos.map((r) => ({ title: r.title, type: r.type, isPublic: true, downloads: r.downloads })),
    });
  }

  // Datos de continuidad para el portafolio (mock que ya estaba hardcodeado
  // en frontend/src/data/public.ts). Se usan en dos siembras independientes:
  // proyectos internos de ejemplo (Project.isPublic) y, por separado,
  // publicaciones del Portafolio Público (public_content) — son CRUD
  // independientes desde la corrección de Contenido Público, así que cada
  // siembra tiene su propio guard de "no pisar datos ya existentes".
  const proyectosPub: { name: string; cat: string; stage: ProjectStage; desc: string; impact: string; owner: string }[] = [
    { name: 'Triage digital asistido por IA', cat: 'IA', stage: ProjectStage.PILOTO, desc: 'Priorización clínica automática en box de urgencia.', impact: '-22% tiempo de espera', owner: 'Dr. M. Soto' },
    { name: 'Trazabilidad de pacientes en tiempo real', cat: 'Transformación Digital', stage: ProjectStage.IMPLEMENTACION, desc: 'Tablero de flujo y ocupación integrado al HIS.', impact: '8 unidades conectadas', owner: 'Ing. P. Rivas' },
    { name: 'Programa Humaniza Urgencia', cat: 'Humanización', stage: ProjectStage.ESCALAMIENTO, desc: 'Rediseño del acompañamiento a familias.', impact: '+31 puntos NPS', owner: 'EU. C. Díaz' },
    { name: 'Tótem de autoatención', cat: 'Gestión', stage: ProjectStage.FACTIBILIDAD, desc: 'Registro y orientación sin filas en admisión.', impact: '-15% filas estimado', owner: 'Sr. A. Vera' },
    { name: 'Wearables de monitoreo en box', cat: 'Clínicos', stage: ProjectStage.PRIORIZACION, desc: 'Signos vitales continuos con alertas tempranas.', impact: 'alertas en tiempo real', owner: 'Dr. J. Lagos' },
    { name: 'Observatorio de evidencia clínica', cat: 'Investigación', stage: ProjectStage.DESARROLLO, desc: 'Repositorio de estudios y resultados del hospital.', impact: '12 publicaciones', owner: 'Dra. R. Cárcamo' },
  ];

  const hasPublicProjects = (await prisma.project.count({ where: { isPublic: true } })) > 0;
  if (!hasPublicProjects) {
    await prisma.project.createMany({
      data: proyectosPub.map((p, i) => ({
        name: p.name,
        description: p.desc,
        category: p.cat,
        stage: p.stage,
        ownerName: p.owner,
        kpiSummary: p.impact,
        isPublic: true,
        isFeatured: i === 0,
        sortOrder: i,
      })),
    });
  }

  // Portafolio Público (CRUD independiente, ver public-content.service.ts):
  // mismas 6 iniciativas como publicaciones públicas, desvinculadas del
  // seguimiento interno — la página /portafolio lee desde aquí.
  const hasPublicPortfolioItems = (await prisma.publicContent.count({ where: { section: ContentSection.PORTAFOLIO } })) > 0;
  if (!hasPublicPortfolioItems) {
    await prisma.publicContent.createMany({
      data: proyectosPub.map((p, i) => ({
        section: ContentSection.PORTAFOLIO,
        slug: `portafolio-${i + 1}`,
        title: p.name,
        excerpt: p.desc,
        category: p.cat,
        expectedBenefits: p.impact,
        isPublished: true,
        isFeatured: i === 0,
        sortOrder: i,
        publishedAt: new Date(),
      })),
    });
  }
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
