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
    where: { email: 'admin@oficina.com' },
    update: {},
    create: {
      id: 'user-1',
      tenantId: tenant.id,
      email: 'admin@oficina.com',
      name: 'Admin Mock',
      role: 'ADMIN',
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
