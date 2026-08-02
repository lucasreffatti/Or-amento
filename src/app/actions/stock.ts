'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getStockItems() {
  const session = await getSession()
  if (!session?.tenantId) return []

  return await prisma.stockItem.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { description: 'asc' }
  })
}

export async function createStockItem(formData: FormData) {
  const session = await getSession()
  if (!session?.tenantId) throw new Error('Não autorizado')

  const code = (formData.get('code') as string)?.trim()
  const description = (formData.get('description') as string)?.trim()
  const ncm = (formData.get('ncm') as string)?.trim() || '8708.29.99'
  const cest = (formData.get('cest') as string)?.trim() || null
  const unit = (formData.get('unit') as string)?.trim() || 'UN'
  const costPrice = parseFloat(formData.get('costPrice') as string || '0')
  const salePrice = parseFloat(formData.get('salePrice') as string || '0')
  const quantity = parseInt(formData.get('quantity') as string || '0', 10)
  const minQuantity = parseInt(formData.get('minQuantity') as string || '2', 10)

  if (!code || !description) {
    throw new Error('Código SKU e Descrição são obrigatórios')
  }

  await prisma.stockItem.create({
    data: {
      tenantId: session.tenantId,
      code,
      description,
      ncm,
      cest,
      unit,
      costPrice,
      salePrice,
      quantity,
      minQuantity
    }
  })

  revalidatePath('/stock')
  revalidatePath('/budgets')
}

export async function updateStockItem(id: string, formData: FormData) {
  const session = await getSession()
  if (!session?.tenantId) throw new Error('Não autorizado')

  const code = (formData.get('code') as string)?.trim()
  const description = (formData.get('description') as string)?.trim()
  const ncm = (formData.get('ncm') as string)?.trim() || '8708.29.99'
  const cest = (formData.get('cest') as string)?.trim() || null
  const unit = (formData.get('unit') as string)?.trim() || 'UN'
  const costPrice = parseFloat(formData.get('costPrice') as string || '0')
  const salePrice = parseFloat(formData.get('salePrice') as string || '0')
  const quantity = parseInt(formData.get('quantity') as string || '0', 10)
  const minQuantity = parseInt(formData.get('minQuantity') as string || '2', 10)

  await prisma.stockItem.update({
    where: { id, tenantId: session.tenantId },
    data: {
      code,
      description,
      ncm,
      cest,
      unit,
      costPrice,
      salePrice,
      quantity,
      minQuantity
    }
  })

  revalidatePath('/stock')
  revalidatePath('/budgets')
}

export async function deleteStockItem(id: string) {
  const session = await getSession()
  if (!session?.tenantId) throw new Error('Não autorizado')

  await prisma.stockItem.delete({
    where: { id, tenantId: session.tenantId }
  })

  revalidatePath('/stock')
  revalidatePath('/budgets')
}

export async function adjustStockQuantity(id: string, delta: number) {
  const session = await getSession()
  if (!session?.tenantId) throw new Error('Não autorizado')

  const item = await prisma.stockItem.findUnique({
    where: { id, tenantId: session.tenantId }
  })

  if (!item) throw new Error('Item não encontrado')

  const newQuantity = Math.max(0, item.quantity + delta)

  await prisma.stockItem.update({
    where: { id, tenantId: session.tenantId },
    data: { quantity: newQuantity }
  })

  revalidatePath('/stock')
  revalidatePath('/budgets')
}
