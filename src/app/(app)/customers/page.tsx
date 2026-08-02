import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import CustomersClient from './CustomersClient'

export default async function CustomersPage() {
  const session = await getSession()
  const customers = await prisma.customer.findMany({
    where: { tenantId: session.tenantId },
    include: {
      vehicles: true,
      budgets: true
    },
    orderBy: { createdAt: 'desc' }
  })

  return <CustomersClient initialCustomers={customers} />
}
