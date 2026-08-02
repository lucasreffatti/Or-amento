const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { id: 'tenant-1' }, // Ensure we have a default tenant for the MVP
    update: {
      name: 'Auto Elétrica Sérgio Car',
      phone: '(48) 99172-7541',
      document: '22.980.022/0001-06',
      address: 'Rua Jacob Weingatner, 4198 - Centro - CEP 88131-400 - Palhoça/SC',
    },
    create: {
      id: 'tenant-1',
      name: 'Auto Elétrica Sérgio Car',
      phone: '(48) 99172-7541',
      document: '22.980.022/0001-06',
      address: 'Rua Jacob Weingatner, 4198 - Centro - CEP 88131-400 - Palhoça/SC',
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
