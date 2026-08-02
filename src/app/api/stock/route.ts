import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const stockItems = await prisma.stockItem.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { description: 'asc' }
    })

    return NextResponse.json(stockItems)
  } catch (error) {
    console.error('[API /api/stock Error]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
