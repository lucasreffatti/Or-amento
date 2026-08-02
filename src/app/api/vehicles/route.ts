import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const vehicles = await prisma.vehicle.findMany({
    where: { tenantId: session.tenantId },
    include: { customer: true }
  })

  return NextResponse.json(vehicles)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { customerId, plate, brand, model, year, engineType, mileage } = body

    if (!customerId || !plate || !brand || !model || !year || !engineType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Valida se o customer pertence ao tenant
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId: session.tenantId }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found or access denied' }, { status: 403 })
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        tenantId: session.tenantId,
        customerId,
        plate,
        brand,
        model,
        year: parseInt(year, 10),
        engineType,
        mileage: mileage ? parseInt(mileage, 10) : null
      }
    })

    return NextResponse.json(vehicle, { status: 201 })
  } catch (error) {
    console.error('[API /api/vehicles Error]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
