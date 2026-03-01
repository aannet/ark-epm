import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const permissions = [
    { name: 'applications:read', description: 'Read applications' },
    { name: 'applications:write', description: 'Create/update/delete applications' },
    { name: 'business-capabilities:read', description: 'Read business capabilities' },
    { name: 'business-capabilities:write', description: 'Create/update/delete business capabilities' },
    { name: 'data-objects:read', description: 'Read data objects' },
    { name: 'data-objects:write', description: 'Create/update/delete data objects' },
    { name: 'interfaces:read', description: 'Read interfaces' },
    { name: 'interfaces:write', description: 'Create/update/delete interfaces' },
    { name: 'it-components:read', description: 'Read IT components' },
    { name: 'it-components:write', description: 'Create/update/delete IT components' },
    { name: 'providers:read', description: 'Read providers' },
    { name: 'providers:write', description: 'Create/update/delete providers' },
    { name: 'domains:read', description: 'Read domains' },
    { name: 'domains:write', description: 'Create/update/delete domains' },
    { name: 'users:read', description: 'Read users' },
    { name: 'users:write', description: 'Create/update/deactivate users' },
    { name: 'roles:read', description: 'Read roles' },
    { name: 'roles:write', description: 'Create/update/delete roles' },
    { name: 'permissions:read', description: 'Read permissions' },
    { name: 'permissions:write', description: 'Create permissions' },
  ];

  for (const perm of permissions) {
    const existing = await prisma.permission.findUnique({ where: { name: perm.name } });
    if (!existing) {
      await prisma.$executeRaw`INSERT INTO permissions (id, name, description) VALUES (gen_random_uuid(), ${perm.name}, ${perm.description})`;
    }
  }

  const existingRole = await prisma.role.findUnique({ where: { name: 'Admin' } });
  if (!existingRole) {
    await prisma.$executeRaw`INSERT INTO roles (id, name, description) VALUES (gen_random_uuid(), 'Admin', 'Administrator with all permissions')`;
  }

  const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });
  if (!adminRole) throw new Error('Admin role not created');

  const allPermissions = await prisma.permission.findMany();
  for (const perm of allPermissions) {
    const existing = await prisma.rolePermission.findUnique({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
    });
    if (!existing) {
      await prisma.$executeRaw`INSERT INTO role_permissions (role_id, permission_id) VALUES (${adminRole.id}::uuid, ${perm.id}::uuid)`;
    }
  }

  const existingUser = await prisma.user.findUnique({ where: { email: 'admin@ark.io' } });
  if (!existingUser) {
    const passwordHash = await bcrypt.hash('admin123456', 12);
    await prisma.$executeRaw`INSERT INTO users (id, email, password_hash, first_name, last_name, role_id, is_active) 
      VALUES (gen_random_uuid(), ${'admin@ark.io'}::varchar, ${passwordHash}::varchar, ${'Admin'}::varchar, ${'User'}::varchar, ${adminRole.id}::uuid, true)`;
  }

  console.log('Seed completed: Admin user created (admin@ark.io / admin123456)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
