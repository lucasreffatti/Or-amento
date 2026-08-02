import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const checklists = await prisma.checklist.findMany({
    where: { tenantId: session.tenantId },
    include: { vehicle: true, customer: true }
  })

  return NextResponse.json(checklists)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { vehicleId, customerId, fuelLevel, reportedIssue, obd2Codes, itemsStatus } = body

    if (!vehicleId || !customerId || fuelLevel === undefined || !reportedIssue || !itemsStatus) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Tenant Check (Security)
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, tenantId: session.tenantId }
    })
    
    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found or access denied' }, { status: 403 })
    }

    const checklist = await prisma.checklist.create({
      data: {
        tenantId: session.tenantId,
        vehicleId,
        customerId,
        fuelLevel: parseInt(fuelLevel, 10),
        reportedIssue,
        obd2Codes,
        itemsStatus: JSON.stringify(itemsStatus),
        imagesUrls: JSON.stringify([])
      }
    })

    return NextResponse.json(checklist, { status: 201 })
  } catch (error) {
    console.error('[API /api/checklists Error]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
