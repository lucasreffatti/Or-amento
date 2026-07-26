'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function updateBudgetStatus(budgetId: string, status: string) {
 const session = await getSession()
 
 // Verifica se o usuário tem permissão para alterar este orçamento
 const budget = await prisma.budget.findUnique({
 where: { 
 id: budgetId,
 tenantId: session.tenantId
 }
 })

 if (!budget) {
 throw new Error('Orçamento não encontrado')
 }

 await prisma.budget.update({
 where: { id: budgetId },
 data: { status }
 })

 revalidatePath('/budgets')
 revalidatePath(`/budgets/${budgetId}`)
}

export async function updateBudgetInfo(budgetId: string, formData: FormData) {
 const session = await getSession()
 
 const budget = await prisma.budget.findUnique({
 where: { 
 id: budgetId,
 tenantId: session.tenantId
 }
 })

 if (!budget) {
 throw new Error('Orçamento não encontrado')
 }

 const validUntil = formData.get('validUntil') as string
 const discountStr = formData.get('discount') as string
 const discount = discountStr ? parseFloat(discountStr) : 0

 const finalTotal = budget.totalLabor + budget.totalParts - discount

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
}
