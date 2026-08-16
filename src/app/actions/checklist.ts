'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export type ActionState = {
  success: boolean
  message: string
  data?: any
}

// ==========================================
// SCHEMAS DE VALIDAÇÃO (ZOD)
// ==========================================
const ChecklistSchema = z.object({
  vehicleId: z.string().min(1, 'Selecione um veículo'),
  customerId: z.string().min(1, 'Selecione um cliente'),
  fuelLevel: z.coerce.number().min(0).max(100),
  reportedIssue: z.string().optional(),
  additionalInfo: z.string().optional(),
  obd2Codes: z.string().optional(),
  itemsStatus: z.string().optional()
})

const ChecklistStatusSchema = z.enum([
  'PENDENTE', 'APROVADO', 'RECUSADO'
])

// ==========================================
// SERVER ACTIONS
// ==========================================
export async function createChecklist(formData: FormData): Promise<ActionState> {
  try {
    const session = await getSession()
    if (!session?.tenantId) return { success: false, message: 'Não autorizado' }

    const parsedData = ChecklistSchema.safeParse({
      vehicleId: formData.get('vehicleId'),
      customerId: formData.get('customerId'),
      fuelLevel: formData.get('fuelLevel'),
      reportedIssue: formData.get('reportedIssue'),
      additionalInfo: formData.get('additionalInfo'),
      obd2Codes: formData.get('obd2Codes'),
      itemsStatus: formData.get('itemsStatus')
    })

    if (!parsedData.success) {
      return { success: false, message: 'Preencha os dados do cliente e do veículo corretamente.' }
    }

    const { vehicleId, customerId, fuelLevel, reportedIssue, additionalInfo, obd2Codes, itemsStatus: itemsStatusRaw } = parsedData.data
    const budgetId = formData.get('budgetId') as string | null

    let itemsStatus = {}
    try {
      if (itemsStatusRaw) itemsStatus = JSON.parse(itemsStatusRaw)
    } catch (e) {
      console.error('[Action createChecklist]: Invalid itemsStatus JSON string')
    }

    const imagesUrlsRaw = (formData.get('imagesUrls') as string) || '[]'
    const damagePinsRaw = (formData.get('damagePins') as string) || '[]'

    const checklist = await prisma.checklist.create({
      data: {
        tenantId: session.tenantId,
        vehicleId,
        customerId,
        fuelLevel,
        itemsStatus: JSON.stringify(itemsStatus),
        imagesUrls: imagesUrlsRaw,
        damagePins: damagePinsRaw,
        reportedIssue: reportedIssue || '',
        additionalInfo: additionalInfo || '',
        obd2Codes: obd2Codes || '',
      }
    })

    // Se veio a partir de um orçamento, atrela o checklist a ele
    if (budgetId) {
      await prisma.budget.update({
        where: { id: budgetId },
        data: { checklistId: checklist.id }
      })
      revalidatePath(`/budgets/${budgetId}`)
      return { success: true, message: 'Vistoria criada com sucesso.', data: { redirectUrl: `/budgets/${budgetId}` } }
    }

    revalidatePath('/checklists')
    return { success: true, message: 'Vistoria criada com sucesso.', data: { redirectUrl: `/checklists/${checklist.id}` } }
  } catch (error: any) {
    console.error('[createChecklist]', error)
    return { success: false, message: 'Erro ao criar a vistoria.' }
  }
}

export async function updateChecklist(id: string, formData: FormData): Promise<ActionState> {
  try {
    const session = await getSession()
    if (!session?.tenantId) return { success: false, message: 'Não autorizado' }

    const parsedData = ChecklistSchema.safeParse({
      vehicleId: formData.get('vehicleId'),
      customerId: formData.get('customerId'),
      fuelLevel: formData.get('fuelLevel'),
      reportedIssue: formData.get('reportedIssue'),
      additionalInfo: formData.get('additionalInfo'),
      obd2Codes: formData.get('obd2Codes'),
      itemsStatus: formData.get('itemsStatus')
    })

    if (!parsedData.success) {
      return { success: false, message: 'Dados inválidos. Verifique cliente e veículo.' }
    }

    const { vehicleId, customerId, fuelLevel, reportedIssue, additionalInfo, obd2Codes, itemsStatus: itemsStatusRaw } = parsedData.data

    let itemsStatus = {}
    try {
      if (itemsStatusRaw) itemsStatus = JSON.parse(itemsStatusRaw)
    } catch (e) {
      console.error('[Action updateChecklist]: Invalid itemsStatus JSON string')
    }

    const imagesUrlsRaw = formData.get('imagesUrls') as string
    const damagePinsRaw = formData.get('damagePins') as string

    const updateData: any = {
      vehicleId,
      customerId,
      fuelLevel,
      itemsStatus: JSON.stringify(itemsStatus),
      reportedIssue: reportedIssue || '',
      additionalInfo: additionalInfo || '',
      obd2Codes: obd2Codes || '',
    }

    if (imagesUrlsRaw !== null) {
      updateData.imagesUrls = imagesUrlsRaw
    }
    if (damagePinsRaw !== null) {
      updateData.damagePins = damagePinsRaw
    }

    await prisma.checklist.update({
      where: { 
        id,
        tenantId: session.tenantId 
      },
      data: updateData
    })

    revalidatePath(`/checklists/${id}`)
    return { success: true, message: 'Vistoria atualizada com sucesso.', data: { redirectUrl: `/checklists/${id}` } }
  } catch (error: any) {
    console.error('[updateChecklist]', error)
    return { success: false, message: 'Erro ao atualizar a vistoria.' }
  }
}

export async function updateChecklistStatus(id: string, status: string): Promise<ActionState> {
  try {
    const session = await getSession()
    if (!session?.tenantId) return { success: false, message: 'Não autorizado' }

    const parsedStatus = ChecklistStatusSchema.safeParse(status)
    if (!parsedStatus.success) {
      return { success: false, message: 'Status inválido.' }
    }

    const updatedChecklist = await prisma.checklist.update({
      where: { id, tenantId: session.tenantId },
      data: { status: parsedStatus.data }
    })

    // Se a vistoria for recusada/reprovada, atualiza também o orçamento atrelado a ela
    if (parsedStatus.data === 'RECUSADO') {
      await prisma.budget.updateMany({
        where: {
          tenantId: session.tenantId,
          OR: [
            { checklistId: id },
            { vehicleId: updatedChecklist.vehicleId, status: { in: ['DRAFT', 'SENT'] } }
          ]
        },
        data: { status: 'REJECTED' }
      })
    }
    
    revalidatePath('/checklists')
    revalidatePath(`/checklists/${id}`)
    revalidatePath('/budgets')

    return { success: true, message: 'Status atualizado com sucesso.' }
  } catch (error: any) {
    console.error('[updateChecklistStatus]', error)
    return { success: false, message: 'Erro ao atualizar status da vistoria.' }
  }
}
