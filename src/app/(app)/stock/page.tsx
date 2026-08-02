import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import StockClient from './StockClient'

export default async function StockPage() {
  const session = await getSession()
  if (!session?.tenantId) return null

  const items = await prisma.stockItem.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { description: 'asc' }
  })

  return <StockClient initialItems={items} />
}
