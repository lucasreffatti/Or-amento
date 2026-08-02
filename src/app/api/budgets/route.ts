import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const budgets = await prisma.budget.findMany({
    where: { tenantId: session.tenantId },
    include: { vehicle: true, customer: true, items: true },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(budgets)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { vehicleId, customerId, validUntil, items, discount } = body

    if (!vehicleId || !customerId || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Valida Tenant
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, tenantId: session.tenantId }
    })
    
    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found or access denied' }, { status: 403 })
    }

    let totalLabor = 0
    let totalParts = 0

    items.forEach((item: any) => {
      const lineTotal = item.unitPrice * (item.quantity || 1)
      if (item.type === 'LABOR') totalLabor += lineTotal
      if (item.type === 'PART') totalParts += lineTotal
    })

    const finalTotal = totalLabor + totalParts - (discount || 0)

    const budget = await prisma.budget.create({
      data: {
        tenantId: session.tenantId,
        vehicleId,
        customerId,
        validUntil: new Date(validUntil || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // default +7 dias
        status: 'DRAFT',
        totalLabor,
        totalParts,
        discount: discount || 0,
        finalTotal,
        items: {
          create: items.map((item: any) => ({
            type: item.type,
            description: item.description,
            quantity: item.quantity || 1,
            unitCost: item.unitCost || 0,
            unitPrice: item.unitPrice
          }))
        }
      },
      include: {
        items: true
      }
    })

    return NextResponse.json(budget, { status: 201 })
  } catch (error) {
    console.error('[API /api/budgets Error]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
