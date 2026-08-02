import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import BudgetsClient from './BudgetsClient'

export default async function BudgetsPage() {
  const session = await getSession()
  const budgets = await prisma.budget.findMany({
    where: { tenantId: session.tenantId },
    include: {
      customer: true,
      vehicle: true,
      checklist: true
    },
    orderBy: { createdAt: 'desc' }
  })

  return <BudgetsClient initialBudgets={budgets} />
}
