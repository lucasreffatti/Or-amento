'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function deleteChecklist(id: string) {
  const session = await getSession()
  
  // Limpar a referência de checklistId nos orçamentos para evitar erro de Foreign Key
  await prisma.budget.updateMany({
    where: { checklistId: id, tenantId: session.tenantId },
    data: { checklistId: null }
  })
  
  await prisma.checklist.delete({
    where: { id, tenantId: session.tenantId }
  })
  
  revalidatePath('/checklists')
  revalidatePath('/budgets')
  redirect('/checklists')
}

export async function deleteBudget(id: string) {
  const session = await getSession()
  
  // 1. Apaga faturas/notas associadas a este orçamento primeiro
  await prisma.invoice.deleteMany({
    where: { budgetId: id, tenantId: session.tenantId }
  })

  // 2. BudgetItem possui onDelete: Cascade no schema, deleta o orçamento
  await prisma.budget.delete({
    where: { id, tenantId: session.tenantId }
  })
  
  revalidatePath('/budgets')
  revalidatePath('/checklists')
  revalidatePath('/customers')
  revalidatePath('/vehicles')
  revalidatePath('/invoices')
  redirect('/budgets')
}

export async function deleteVehicle(id: string) {
  const session = await getSession()
  
  await prisma.$transaction(async (tx) => {
    // 1. Encontrar orçamentos deste veículo
    const budgets = await tx.budget.findMany({ where: { vehicleId: id, tenantId: session.tenantId } })
    const budgetIds = budgets.map(b => b.id)
    
    // Deletar notas fiscais dos orçamentos
    await tx.invoice.deleteMany({
      where: { budgetId: { in: budgetIds } }
    })

    // Deletar itens dos orçamentos
    await tx.budgetItem.deleteMany({
      where: { budgetId: { in: budgetIds } }
    })
    
    // 2. Deletar orçamentos e checklists
    await tx.budget.deleteMany({ where: { vehicleId: id, tenantId: session.tenantId } })
    await tx.checklist.deleteMany({ where: { vehicleId: id, tenantId: session.tenantId } })
    
    // 3. Finalmente deletar o veículo
    await tx.vehicle.delete({ where: { id, tenantId: session.tenantId } })
  })
  
  revalidatePath('/vehicles')
  revalidatePath('/budgets')
  revalidatePath('/checklists')
  revalidatePath('/invoices')
  redirect('/vehicles')
}

export async function deleteCustomer(id: string) {
  const session = await getSession()
  
  await prisma.$transaction(async (tx) => {
    // 1. Encontrar todos orçamentos do cliente
    const budgets = await tx.budget.findMany({ where: { customerId: id, tenantId: session.tenantId } })
    const budgetIds = budgets.map(b => b.id)
    
    // Deletar notas fiscais do cliente e dos orçamentos
    await tx.invoice.deleteMany({ where: { customerId: id, tenantId: session.tenantId } })

    // Limpar itens dos orçamentos
    await tx.budgetItem.deleteMany({
      where: { budgetId: { in: budgetIds } }
    })
    
    // 3. Deletar orçamentos e checklists do cliente
    await tx.budget.deleteMany({ where: { customerId: id, tenantId: session.tenantId } })
    await tx.checklist.deleteMany({ where: { customerId: id, tenantId: session.tenantId } })
    
    // 4. Deletar veículos do cliente
    await tx.vehicle.deleteMany({ where: { customerId: id, tenantId: session.tenantId } })
    
    // 5. Deletar cliente
    await tx.customer.delete({ where: { id, tenantId: session.tenantId } })
  })
  
  revalidatePath('/customers')
  revalidatePath('/budgets')
  revalidatePath('/checklists')
  revalidatePath('/vehicles')
  revalidatePath('/invoices')
  redirect('/customers')
}

export async function deleteChecklistsBulk(ids: string[]) {
  const session = await getSession()
  if (!session?.tenantId || !ids.length) return { success: false, message: 'Nenhum item informado' }

  await prisma.budget.updateMany({
    where: { checklistId: { in: ids }, tenantId: session.tenantId },
    data: { checklistId: null }
  })

  await prisma.checklist.deleteMany({
    where: { id: { in: ids }, tenantId: session.tenantId }
  })

  revalidatePath('/checklists')
  revalidatePath('/budgets')
  return { success: true }
}

export async function deleteBudgetsBulk(ids: string[]) {
  const session = await getSession()
  if (!session?.tenantId || !ids.length) return { success: false, message: 'Nenhum item informado' }

  await prisma.invoice.deleteMany({
    where: { budgetId: { in: ids }, tenantId: session.tenantId }
  })

  await prisma.budgetItem.deleteMany({
    where: { budgetId: { in: ids } }
  })

  await prisma.budget.deleteMany({
    where: { id: { in: ids }, tenantId: session.tenantId }
  })

  revalidatePath('/budgets')
  revalidatePath('/checklists')
  revalidatePath('/customers')
  revalidatePath('/vehicles')
  revalidatePath('/invoices')
  return { success: true }
}

export async function deleteVehiclesBulk(ids: string[]) {
  const session = await getSession()
  if (!session?.tenantId || !ids.length) return { success: false, message: 'Nenhum item informado' }

  await prisma.$transaction(async (tx) => {
    const budgets = await tx.budget.findMany({ where: { vehicleId: { in: ids }, tenantId: session.tenantId } })
    const budgetIds = budgets.map(b => b.id)

    await tx.invoice.deleteMany({
      where: { budgetId: { in: budgetIds } }
    })

    await tx.budgetItem.deleteMany({
      where: { budgetId: { in: budgetIds } }
    })

    await tx.budget.deleteMany({ where: { vehicleId: { in: ids }, tenantId: session.tenantId } })
    await tx.checklist.deleteMany({ where: { vehicleId: { in: ids }, tenantId: session.tenantId } })
    await tx.vehicle.deleteMany({ where: { id: { in: ids }, tenantId: session.tenantId } })
  })

  revalidatePath('/vehicles')
  revalidatePath('/budgets')
  revalidatePath('/checklists')
  revalidatePath('/invoices')
  return { success: true }
}

export async function deleteCustomersBulk(ids: string[]) {
  const session = await getSession()
  if (!session?.tenantId || !ids.length) return { success: false, message: 'Nenhum item informado' }

  await prisma.$transaction(async (tx) => {
    const budgets = await tx.budget.findMany({ where: { customerId: { in: ids }, tenantId: session.tenantId } })
    const budgetIds = budgets.map(b => b.id)

    await tx.invoice.deleteMany({ where: { customerId: { in: ids }, tenantId: session.tenantId } })
    await tx.budgetItem.deleteMany({ where: { budgetId: { in: budgetIds } } })
    await tx.budget.deleteMany({ where: { customerId: { in: ids }, tenantId: session.tenantId } })
    await tx.checklist.deleteMany({ where: { customerId: { in: ids }, tenantId: session.tenantId } })
    await tx.vehicle.deleteMany({ where: { customerId: { in: ids }, tenantId: session.tenantId } })
    await tx.customer.deleteMany({ where: { id: { in: ids }, tenantId: session.tenantId } })
  })

  revalidatePath('/customers')
  revalidatePath('/budgets')
  revalidatePath('/checklists')
  revalidatePath('/vehicles')
  revalidatePath('/invoices')
  return { success: true }
}

export async function deleteStockItemsBulk(ids: string[]) {
  const session = await getSession()
  if (!session?.tenantId || !ids.length) return { success: false, message: 'Nenhum item informado' }

  await prisma.stockItem.deleteMany({
    where: { id: { in: ids }, tenantId: session.tenantId }
  })

  revalidatePath('/stock')
  revalidatePath('/budgets')
  return { success: true }
}
