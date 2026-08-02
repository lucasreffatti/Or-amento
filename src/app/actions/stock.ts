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

const StockItemSchema = z.object({
  code: z.string().min(1, 'Código SKU é obrigatório.'),
  description: z.string().min(1, 'Descrição é obrigatória.'),
  itemType: z.enum(['FIXO', 'ROTATIVO']).default('FIXO'),
  ncm: z.string().nullable().optional().default('8708.29.99'),
  cest: z.string().nullable().optional(),
  unit: z.string().default('UN'),
  costPrice: z.number().min(0, 'O preço de custo não pode ser negativo.'),
  salePrice: z.number().min(0, 'O preço de venda não pode ser negativo.'),
  quantity: z.number().default(0),
  minQuantity: z.number().default(2)
})

export async function getStockItems() {
  const session = await getSession()
  if (!session?.tenantId) return []

  return await prisma.stockItem.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { description: 'asc' }
  })
}

export async function createStockItem(formData: FormData): Promise<ActionState> {
  try {
    const session = await getSession()
    if (!session?.tenantId) return { success: false, message: 'Não autorizado' }

    const data = {
      code: formData.get('code'),
      description: formData.get('description'),
      itemType: formData.get('itemType') || 'FIXO',
      ncm: formData.get('ncm') || null,
      cest: formData.get('cest') || null,
      unit: formData.get('unit') || 'UN',
      costPrice: parseFloat(formData.get('costPrice') as string || '0'),
      salePrice: parseFloat(formData.get('salePrice') as string || '0'),
      quantity: parseInt(formData.get('quantity') as string || '0', 10),
      minQuantity: parseInt(formData.get('minQuantity') as string || '2', 10)
    }

    const validatedData = StockItemSchema.safeParse(data)
    if (!validatedData.success) {
      return { success: false, message: validatedData.error.issues[0].message }
    }

    await prisma.stockItem.create({
      data: {
        ...validatedData.data,
        tenantId: session.tenantId
      }
    })

    revalidatePath('/stock')
    revalidatePath('/budgets')
    return { success: true, message: 'Peça cadastrada com sucesso!' }
  } catch (error) {
    console.error('[createStockItem]', error)
    return { success: false, message: 'Erro ao cadastrar peça. O código pode já existir.' }
  }
}

export async function updateStockItem(id: string, formData: FormData): Promise<ActionState> {
  try {
    const session = await getSession()
    if (!session?.tenantId) return { success: false, message: 'Não autorizado' }

    const data = {
      code: formData.get('code'),
      description: formData.get('description'),
      itemType: formData.get('itemType') || 'FIXO',
      ncm: formData.get('ncm') || null,
      cest: formData.get('cest') || null,
      unit: formData.get('unit') || 'UN',
      costPrice: parseFloat(formData.get('costPrice') as string || '0'),
      salePrice: parseFloat(formData.get('salePrice') as string || '0'),
      quantity: parseInt(formData.get('quantity') as string || '0', 10),
      minQuantity: parseInt(formData.get('minQuantity') as string || '2', 10)
    }

    const validatedData = StockItemSchema.safeParse(data)
    if (!validatedData.success) {
      return { success: false, message: validatedData.error.issues[0].message }
    }

    await prisma.stockItem.update({
      where: { id, tenantId: session.tenantId },
      data: validatedData.data
    })

    revalidatePath('/stock')
    revalidatePath('/budgets')
    return { success: true, message: 'Peça atualizada com sucesso!' }
  } catch (error) {
    console.error('[updateStockItem]', error)
    return { success: false, message: 'Erro ao atualizar peça.' }
  }
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
