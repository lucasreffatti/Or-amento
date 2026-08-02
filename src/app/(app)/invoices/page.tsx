import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import InvoicesClient from './InvoicesClient'

export default async function InvoicesPage() {
  const session = await getSession()
  if (!session?.tenantId) return null

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId }
  })

  const invoices = await prisma.invoice.findMany({
    where: { tenantId: session.tenantId },
    include: {
      customer: true,
      budget: {
        include: { vehicle: true }
      },
      items: true
    },
    orderBy: { createdAt: 'desc' }
  })

  return <InvoicesClient initialInvoices={invoices} tenant={tenant} />
}
