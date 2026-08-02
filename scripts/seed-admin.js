const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { id: 'tenant-1' },
    update: {
      name: 'Auto Elétrica Sérgio Car',
      phone: '(48) 99172-7541',
      document: '22.980.022/0001-06',
      address: 'Rua Jacob Weingatner, 4198 - Centro - CEP 88131-400 - Palhoça/SC',
      ie: '123.456.789',
      im: '987654',
      taxRegime: 'SIMPLES_NACIONAL',
      cnae: '4520-0/01',
      cityIbge: '4211900',
      nfeEnvironment: 'HOMOLOGATION',
    },
    create: {
      id: 'tenant-1',
      name: 'Auto Elétrica Sérgio Car',
      phone: '(48) 99172-7541',
      document: '22.980.022/0001-06',
      address: 'Rua Jacob Weingatner, 4198 - Centro - CEP 88131-400 - Palhoça/SC',
      ie: '123.456.789',
      im: '987654',
      taxRegime: 'SIMPLES_NACIONAL',
      cnae: '4520-0/01',
      cityIbge: '4211900',
      nfeEnvironment: 'HOMOLOGATION',
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

  // Seed de Peças Iniciais no Estoque
  const stockItems = [
    { code: 'BAT-60AH', description: 'Bateria Moura 60Ah 12V (M60AD)', ncm: '8507.10.10', unit: 'UN', costPrice: 320.00, salePrice: 480.00, quantity: 8, minQuantity: 3 },
    { code: 'ALT-120A', description: 'Alternador Bosch 120A VW/GM', ncm: '8511.50.10', unit: 'UN', costPrice: 450.00, salePrice: 750.00, quantity: 4, minQuantity: 2 },
    { code: 'PAS-DIANT', description: 'Jogo Pastilha Freio Dianteiro Cobreq', ncm: '8708.30.90', unit: 'JG', costPrice: 65.00, salePrice: 130.00, quantity: 12, minQuantity: 4 },
    { code: 'LAMP-H7', description: 'Lâmpada Farol H7 12V 55W Osram', ncm: '8539.21.10', unit: 'UN', costPrice: 18.00, salePrice: 40.00, quantity: 25, minQuantity: 5 },
    { code: 'OLEO-5W30', description: 'Óleo Motor 5W30 Sintético 1 Litro Mobil', ncm: '2710.19.32', unit: 'LT', costPrice: 28.00, salePrice: 55.00, quantity: 30, minQuantity: 10 },
  ];

  for (const item of stockItems) {
    await prisma.stockItem.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: item.code } },
      update: item,
      create: { ...item, tenantId: tenant.id },
    });
  }

  console.log('Admin user and initial stock items seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
