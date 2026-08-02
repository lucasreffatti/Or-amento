import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getStockEntriesAction } from '@/app/actions/stockEntry'
import StockClient from './StockClient'

export default async function StockPage() {
  const session = await getSession()
  if (!session?.tenantId) return null

  const items = await prisma.stockItem.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { description: 'asc' }
  })

  const entries = await getStockEntriesAction()

  return <StockClient initialItems={items} initialEntries={entries} />
}
