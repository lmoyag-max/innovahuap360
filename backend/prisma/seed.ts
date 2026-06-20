import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes } from 'node:crypto';

const prisma = new PrismaClient();

const PERMISSIONS = [
  'users.read', 'users.manage',
  'roles.read', 'roles.manage',
  'content.manage',
  'projects.read', 'projects.manage',
  'minutes.read', 'minutes.manage',
  'knowledge.read', 'knowledge.manage',
  'communications.read', 'communications.manage',
  'dashboard.read',
  'uploads.manage',
  'audit.read',
  'settings.manage',
  'innovaia.use',
  'ideas.read', 'ideas.manage',
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: PERMISSIONS,
  coordinador: [
    'projects.read', 'projects.manage',
    'minutes.read', 'minutes.manage',
    'knowledge.read', 'knowledge.manage',
    'communications.read', 'communications.manage',
    'dashboard.read', 'content.manage', 'uploads.manage', 'audit.read', 'innovaia.use',
    'ideas.read', 'ideas.manage',
  ],
  miembro_comite: [
    'projects.read', 'projects.manage',
    'minutes.read', 'minutes.manage',
    'knowledge.read', 'communications.read', 'dashboard.read', 'innovaia.use',
    'ideas.read',
  ],
  lector: ['projects.read', 'minutes.read', 'knowledge.read', 'communications.read', 'dashboard.read', 'ideas.read'],
};

const ROLE_NAMES: Record<string, string> = {
  admin: 'Administrador',
  coordinador: 'Coordinador del Comité',
  miembro_comite: 'Miembro del Comité',
  lector: 'Lector',
};

async function main() {
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

  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@innovahuap.local';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const adminPassword = process.env.ADMIN_PASSWORD ?? randomBytes(12).toString('base64url');
    const adminRole = await prisma.role.findUniqueOrThrow({ where: { key: 'admin' } });

    await prisma.user.create({
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
