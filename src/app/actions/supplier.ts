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
const SupplierSchema = z.object({
  name: z.string().min(1, 'Razão Social é obrigatória'),
  tradeName: z.string().optional(),
  document: z.string().min(1, 'CNPJ/CPF é obrigatório'),
  ie: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional()
})

// ==========================================
// SERVER ACTIONS
// ==========================================

export async function getSuppliers() {
  const session = await getSession()
  if (!session?.tenantId) return []

  return prisma.supplier.findMany({
    where: { tenantId: session.tenantId },
    include: {
      stockEntries: {
        select: {
          id: true,
          totalAmount: true,
          issueDate: true
        }
      },
      _count: {
        select: { stockItems: true, stockEntries: true }
      }
    },
    orderBy: { name: 'asc' }
  })
}

export async function createSupplier(formData: FormData): Promise<ActionState> {
  try {
    const session = await getSession()
    if (!session?.tenantId) return { success: false, message: 'Não autorizado' }

    const rawDocument = formData.get('document') as string || ''
    const cleanDocument = rawDocument.replace(/\D/g, '')

    const parsedData = SupplierSchema.safeParse({
      name: formData.get('name'),
      tradeName: formData.get('tradeName'),
      document: cleanDocument,
      ie: formData.get('ie'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      address: formData.get('address'),
      city: formData.get('city'),
      state: formData.get('state')
    })

    if (!parsedData.success) {
      return { success: false, message: 'Dados inválidos. Verifique Razão Social e CNPJ.' }
    }

    const { name, tradeName, document, ie, phone, email, address, city, state } = parsedData.data

    // Verificar se CNPJ já existe
    const existing = await prisma.supplier.findUnique({
      where: {
        tenantId_document: {
          tenantId: session.tenantId,
          document
        }
      }
    })

    if (existing) {
      return { success: false, message: 'Já existe um fornecedor cadastrado com este CNPJ.' }
    }

    await prisma.supplier.create({
      data: {
        tenantId: session.tenantId,
        name,
        tradeName: tradeName || name,
        document,
        ie: ie || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        city: city || null,
        state: state || null
      }
    })

    revalidatePath('/suppliers')
    return { success: true, message: 'Fornecedor cadastrado com sucesso.' }
  } catch (error: any) {
    console.error('[createSupplier]', error)
    return { success: false, message: 'Erro ao cadastrar fornecedor.' }
  }
}

export async function updateSupplier(id: string, formData: FormData): Promise<ActionState> {
  try {
    const session = await getSession()
    if (!session?.tenantId) return { success: false, message: 'Não autorizado' }

    const rawDocument = formData.get('document') as string || ''
    const cleanDocument = rawDocument.replace(/\D/g, '')

    const parsedData = SupplierSchema.safeParse({
      name: formData.get('name'),
      tradeName: formData.get('tradeName'),
      document: cleanDocument,
      ie: formData.get('ie'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      address: formData.get('address'),
      city: formData.get('city'),
      state: formData.get('state')
    })

    if (!parsedData.success) {
      return { success: false, message: 'Dados inválidos. Verifique Razão Social e CNPJ.' }
    }

    const { name, tradeName, document, ie, phone, email, address, city, state } = parsedData.data

    await prisma.supplier.update({
      where: { id, tenantId: session.tenantId },
      data: {
        name,
        tradeName: tradeName || name,
        document,
        ie: ie || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        city: city || null,
        state: state || null
      }
    })

    revalidatePath('/suppliers')
    return { success: true, message: 'Fornecedor atualizado com sucesso.' }
  } catch (error: any) {
    console.error('[updateSupplier]', error)
    return { success: false, message: 'Erro ao atualizar fornecedor.' }
  }
}

export async function deleteSupplier(id: string): Promise<ActionState> {
  try {
    const session = await getSession()
    if (!session?.tenantId) return { success: false, message: 'Não autorizado' }

    // Desvincular das peças antes de excluir para manter histórico intacto
    await prisma.stockItem.updateMany({
      where: { supplierId: id, tenantId: session.tenantId },
      data: { supplierId: null }
    })

    await prisma.supplier.delete({
      where: { id, tenantId: session.tenantId }
    })

    revalidatePath('/suppliers')
    return { success: true, message: 'Fornecedor excluído com sucesso.' }
  } catch (error: any) {
    console.error('[deleteSupplier]', error)
    return { success: false, message: 'Erro ao excluir fornecedor.' }
  }
}
