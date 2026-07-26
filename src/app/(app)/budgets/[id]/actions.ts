'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

async function recalculateBudgetTotals(budgetId: string) {
 const items = await prisma.budgetItem.findMany({
 where: { budgetId }
 })
 
 let totalLabor = 0
 let totalParts = 0
 
 for (const item of items) {
 if (item.type === 'LABOR') {
 totalLabor += (item.unitPrice * item.quantity)
 } else if (item.type === 'PART') {
 totalParts += (item.unitPrice * item.quantity)
 }
 }
 
 const budget = await prisma.budget.findUnique({ where: { id: budgetId } })
 const discount = budget?.discount || 0
 const finalTotal = totalLabor + totalParts - discount
 
 await prisma.budget.update({
 where: { id: budgetId },
 data: {
 totalLabor,
 totalParts,
 finalTotal
 }
 })
}

export async function addBudgetItem(formData: FormData) {
 const budgetId = formData.get('budgetId') as string
 const type = formData.get('type') as string
 const description = formData.get('description') as string
 const quantity = parseInt(formData.get('quantity') as string, 10)
 const unitPrice = parseFloat(formData.get('unitPrice') as string)
 
 await prisma.budgetItem.create({
 data: {
 budgetId,
 type,
 description,
 quantity,
 unitPrice,
 unitCost: 0 // Mocking unit cost as 0 for now as it's not strictly requested by the user
 }
 })
 
 await recalculateBudgetTotals(budgetId)
 revalidatePath(`/budgets/${budgetId}`)
 revalidatePath('/budgets')
}

export async function removeBudgetItem(itemId: string, budgetId: string) {
 await prisma.budgetItem.delete({
 where: { id: itemId }
 })
 
 await recalculateBudgetTotals(budgetId)
 revalidatePath(`/budgets/${budgetId}`)
 revalidatePath('/budgets')
}

export async function updateBudgetStatus(budgetId: string, newStatus: string) {
 await prisma.budget.update({
 where: { id: budgetId },
 data: { status: newStatus }
 })
 
 revalidatePath(`/budgets/${budgetId}`)
 revalidatePath('/budgets')
}
