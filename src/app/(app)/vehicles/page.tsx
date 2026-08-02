import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import VehiclesClient from './VehiclesClient'

export default async function VehiclesPage() {
  const session = await getSession()
  const vehicles = await prisma.vehicle.findMany({
    where: { tenantId: session.tenantId },
    include: {
      customer: true,
      budgets: true,
      checklists: true
    },
    orderBy: { plate: 'asc' }
  })

  return <VehiclesClient initialVehicles={vehicles} />
}
