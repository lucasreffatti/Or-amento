import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const tenant = await prisma.tenant.findFirst()
  if (tenant) {
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        name: 'Auto Elétrica Sérgio Car',
        phone: '(48) 99999-9999',
        document: '22.980.022/0001-06',
        address: 'Santa Catarina Palhoça, nº 4198 - CEP 88131-400'
      }
    })
    console.log('Tenant updated successfully:', tenant.id)
  } else {
    console.log('No tenant found')
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
