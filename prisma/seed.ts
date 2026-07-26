import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { id: 'tenant-1' },
    update: {},
    create: {
      id: 'tenant-1',
      name: 'Oficina Central (Mock)',
    },
  })

  await prisma.user.upsert({
    where: { username: 'adminmock' },
    update: {},
    create: {
      id: 'user-1',
      username: 'adminmock',
      email: 'admin@oficina.com',
      name: 'Admin da Oficina',
      role: 'ADMIN',
      tenantId: 'tenant-1'
    },
  })
  
  console.log('Seed realizado com sucesso!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
