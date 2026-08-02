'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getSuppliers() {
  const session = await getSession()

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

export async function createSupplier(formData: FormData) {
  const session = await getSession()

  const name = formData.get('name') as string
  const tradeName = formData.get('tradeName') as string
  const document = (formData.get('document') as string || '').replace(/\D/g, '')
  const ie = formData.get('ie') as string
  const phone = formData.get('phone') as string
  const email = formData.get('email') as string
  const address = formData.get('address') as string
  const city = formData.get('city') as string
  const state = formData.get('state') as string

  if (!name || !document) {
    throw new Error('Razão Social e CNPJ são campos obrigatórios.')
  }

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
    throw new Error('Já existe um fornecedor cadastrado com este CNPJ.')
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
}

export async function updateSupplier(id: string, formData: FormData) {
  const session = await getSession()

  const name = formData.get('name') as string
  const tradeName = formData.get('tradeName') as string
  const document = (formData.get('document') as string || '').replace(/\D/g, '')
  const ie = formData.get('ie') as string
  const phone = formData.get('phone') as string
  const email = formData.get('email') as string
  const address = formData.get('address') as string
  const city = formData.get('city') as string
  const state = formData.get('state') as string

  await prisma.supplier.update({
    where: { id },
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
}

export async function deleteSupplier(id: string) {
  const session = await getSession()

  // Desvincular das peças antes de excluir para manter histórico intacto
  await prisma.stockItem.updateMany({
    where: { supplierId: id },
    data: { supplierId: null }
  })

  await prisma.supplier.delete({
    where: { id }
  })

  revalidatePath('/suppliers')
}
