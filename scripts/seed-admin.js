const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { id: 'tenant-1' }, // Ensure we have a default tenant for the MVP
    update: {},
    create: {
      id: 'tenant-1',
      name: 'Oficina SergioCar',
      document: '00.000.000/0001-00',
    },
  });

  const passwordHash = await bcrypt.hash('sergiocaradmin', 12);

  const admin = await prisma.user.upsert({
    where: { username: 'sergiocar' },
    update: {
      password: passwordHash,
      role: 'ADMIN',
      tenantId: tenant.id,
    },
    create: {
      username: 'sergiocar',
      password: passwordHash,
      role: 'ADMIN',
      tenantId: tenant.id,
      name: 'Sergio Admin',
    },
  });

  console.log('Admin user seeded:', admin.username);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
