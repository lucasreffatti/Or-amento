import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import ChecklistsClient from './ChecklistsClient'

export default async function ChecklistsPage() {
  const session = await getSession()
  const checklists = await prisma.checklist.findMany({
    where: { tenantId: session.tenantId },
    include: {
      customer: true,
      vehicle: true
    },
    orderBy: { createdAt: 'desc' }
  })

  return <ChecklistsClient initialChecklists={checklists} />
}
