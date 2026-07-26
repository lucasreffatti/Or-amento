'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createChecklist(formData: FormData) {
  const session = await getSession()
  
  const vehicleId = formData.get('vehicleId') as string
  const customerId = formData.get('customerId') as string
  const budgetId = formData.get('budgetId') as string | null
  const fuelLevel = Number(formData.get('fuelLevel') || 0)
  
  // Extrai items (avarias/status de itens)
  // Como é dinâmico, vamos assumir que mandam um JSON hidden ou campos específicos
  const itemsStatusRaw = formData.get('itemsStatus') as string
  let itemsStatus = {}
  try {
    if (itemsStatusRaw) itemsStatus = JSON.parse(itemsStatusRaw)
  } catch (e) {
    console.error('Invalid itemsStatus JSON')
  }

  const checklist = await prisma.checklist.create({
    data: {
      tenantId: session.tenantId,
      vehicleId,
      customerId,
      fuelLevel,
      itemsStatus: JSON.stringify(itemsStatus),
      imagesUrls: '[]', // Futuramente upload
      reportedIssue: '',
    }
  })

  // Se veio a partir de um orçamento, atrela o checklist a ele
  if (budgetId) {
    await prisma.budget.update({
      where: { id: budgetId },
      data: { checklistId: checklist.id }
    })
  }

  revalidatePath('/checklists')
  if (budgetId) {
    revalidatePath(`/budgets/${budgetId}`)
    redirect(`/budgets/${budgetId}`)
  } else {
    redirect(`/checklists/${checklist.id}`)
  }
}
