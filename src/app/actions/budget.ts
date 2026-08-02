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
const BudgetStatusSchema = z.enum([
  'DRAFT', 'SENT', 'PARTIALLY_APPROVED', 'APPROVED', 'REJECTED'
])

const BudgetInfoSchema = z.object({
  validUntil: z.string().min(1, "Data de validade é obrigatória"),
  discount: z.coerce.number().min(0, "O desconto não pode ser negativo")
})

// ==========================================
// SERVER ACTIONS
// ==========================================

export async function updateBudgetStatus(budgetId: string, status: string): Promise<ActionState> {
  try {
    const session = await getSession()
    if (!session?.tenantId) return { success: false, message: 'Não autorizado' }

    // Validação estrita do Zod
    const parsedStatus = BudgetStatusSchema.safeParse(status)
    if (!parsedStatus.success) {
      return { success: false, message: 'Status de orçamento inválido.' }
    }

    const budget = await prisma.budget.findUnique({
      where: { 
        id: budgetId,
        tenantId: session.tenantId
      }
    })

    if (!budget) {
      return { success: false, message: 'Orçamento não encontrado.' }
    }

    await prisma.budget.update({
      where: { id: budgetId },
      data: { status: parsedStatus.data }
    })

    revalidatePath('/budgets')
    revalidatePath(`/budgets/${budgetId}`)

    return { success: true, message: 'Status do orçamento atualizado com sucesso.' }
  } catch (error: any) {
    console.error('[updateBudgetStatus]', error)
    return { success: false, message: 'Ocorreu um erro inesperado ao atualizar o status.' }
  }
}

export async function updateBudgetInfo(budgetId: string, formData: FormData): Promise<ActionState> {
  try {
    const session = await getSession()
    if (!session?.tenantId) return { success: false, message: 'Não autorizado' }

    const budget = await prisma.budget.findUnique({
      where: { 
        id: budgetId,
        tenantId: session.tenantId
      }
    })

    if (!budget) {
      return { success: false, message: 'Orçamento não encontrado.' }
    }

    // Validação de inputs
    const parsedData = BudgetInfoSchema.safeParse({
      validUntil: formData.get('validUntil'),
      discount: formData.get('discount')
    })

    if (!parsedData.success) {
      return { 
        success: false, 
        message: 'Dados inválidos. Verifique a data e o valor do desconto.'
      }
    }

    const { validUntil, discount } = parsedData.data
    const finalTotal = budget.totalLabor + budget.totalParts - discount

    if (finalTotal < 0) {
      return { success: false, message: 'O desconto não pode ser maior que o valor total.' }
    }

    await prisma.budget.update({
      where: { id: budgetId },
      data: { 
        validUntil: new Date(validUntil),
        discount,
        finalTotal
      }
    })

    revalidatePath('/budgets')
    revalidatePath(`/budgets/${budgetId}`)

    return { success: true, message: 'Informações do orçamento salvas com sucesso.' }
  } catch (error: any) {
    console.error('[updateBudgetInfo]', error)
    return { success: false, message: 'Ocorreu um erro ao salvar as informações do orçamento.' }
  }
}
