'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

/**
 * Função utilitária para gerar chave de acesso simulada de 44 dígitos para NF-e/NFS-e
 */
function generateAccessKey(uf: string = '42', yearMonth: string = '2608', cnpj: string = '22980022000106', model: string = '55', series: string = '001', number: number = 101) {
  const randomStr = Math.floor(10000000 + Math.random() * 90000000).toString()
  const rawKey = `${uf}${yearMonth}${cnpj.replace(/\D/g, '')}${model}${series}${number.toString().padStart(9, '0')}1${randomStr}`
  // calcula digito verificador simples
  let sum = 0
  let weight = 2
  for (let i = rawKey.length - 1; i >= 0; i--) {
    sum += parseInt(rawKey[i], 10) * weight
    weight = weight === 9 ? 2 : weight + 1
  }
  const dv = (11 - (sum % 11)) >= 10 ? 0 : 11 - (sum % 11)
  return `${rawKey}${dv}`
}

export async function createInvoiceFromBudget(budgetId: string, type: string = 'COMBINED') {
  const session = await getSession()
  if (!session?.tenantId) throw new Error('Não autorizado')

  const budget = await prisma.budget.findUnique({
    where: { id: budgetId, tenantId: session.tenantId },
    include: {
      items: {
        include: { stockItem: true }
      },
      customer: true
    }
  })

  if (!budget) throw new Error('Orçamento não encontrado')

  // Verifica se já existe nota para este orçamento
  const existingInvoice = await prisma.invoice.findUnique({
    where: { budgetId }
  })

  if (existingInvoice) {
    redirect(`/invoices`)
  }

  // Prepara itens da nota fiscal com dados de NCM e Código de Serviço
  const invoiceItemsData = budget.items.map((item) => {
    if (item.type === 'PART') {
      return {
        type: 'PART',
        description: item.description,
        ncm: item.stockItem?.ncm || '8708.29.99',
        unit: item.stockItem?.unit || 'UN',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.unitPrice * item.quantity
      }
    } else {
      return {
        type: 'SERVICE',
        description: item.description,
        serviceCode: '14.01', // Código de serviço municipal para manutenção de veículos
        unit: 'UN',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.unitPrice * item.quantity
      }
    }
  })

  // Calcula impostos aproximados (Simples Nacional ~6.5%)
  const taxTotal = Math.round(budget.finalTotal * 0.065 * 100) / 100

  const invoice = await prisma.invoice.create({
    data: {
      tenantId: session.tenantId,
      budgetId: budget.id,
      customerId: budget.customerId,
      type,
      status: 'DRAFT',
      laborTotal: budget.totalLabor,
      partsTotal: budget.totalParts,
      taxTotal,
      finalTotal: budget.finalTotal,
      items: {
        create: invoiceItemsData
      }
    }
  })

  revalidatePath(`/budgets/${budgetId}`)
  revalidatePath('/invoices')
  redirect('/invoices')
}

export async function transmitInvoice(invoiceId: string) {
  const session = await getSession()
  if (!session?.tenantId) throw new Error('Não autorizado')

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId, tenantId: session.tenantId },
    include: {
      budget: {
        include: {
          items: { include: { stockItem: true } }
        }
      },
      tenant: true
    }
  })

  if (!invoice) throw new Error('Nota fiscal não encontrada')
  if (invoice.status === 'AUTHORIZED') throw new Error('Nota Fiscal já está autorizada!')

  // 1. Dar baixa no Estoque em tempo real para todos os itens do tipo PART vinculados
  if (invoice.budget?.items) {
    for (const item of invoice.budget.items) {
      if (item.type === 'PART' && item.stockItemId) {
        await prisma.stockItem.update({
          where: { id: item.stockItemId },
          data: {
            quantity: {
              decrement: item.quantity
            }
          }
        })
      }
    }
  }

  // 2. Simular Transmissão da API Fiscal (Focus NFe / PlugNotas / e-Notas)
  const nextNumber = Math.floor(100 + Math.random() * 900)
  const accessKey = generateAccessKey('42', '2608', invoice.tenant.document || '22980022000106', '55', '001', nextNumber)
  const protocol = `1422600${Math.floor(10000000 + Math.random() * 90000000)}`

  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: 'AUTHORIZED',
      number: nextNumber,
      series: 1,
      accessKey,
      protocol,
      pdfUrl: `/api/invoices/danfe/${invoiceId}`,
      xmlUrl: `/api/invoices/xml/${invoiceId}`,
      issuedAt: new Date()
    }
  })

  revalidatePath('/invoices')
  revalidatePath('/stock')
  revalidatePath('/budgets')
  return updatedInvoice
}

export async function cancelInvoice(invoiceId: string, reason: string) {
  const session = await getSession()
  if (!session?.tenantId) throw new Error('Não autorizado')

  if (!reason || reason.length < 15) {
    throw new Error('A justificativa de cancelamento deve conter no mínimo 15 caracteres.')
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId, tenantId: session.tenantId },
    include: {
      budget: {
        include: {
          items: true
        }
      }
    }
  })

  if (!invoice) throw new Error('Nota fiscal não encontrada')

  // Se a nota estava autorizada, estorna a baixa do estoque em tempo real
  if (invoice.status === 'AUTHORIZED' && invoice.budget?.items) {
    for (const item of invoice.budget.items) {
      if (item.type === 'PART' && item.stockItemId) {
        await prisma.stockItem.update({
          where: { id: item.stockItemId },
          data: {
            quantity: {
              increment: item.quantity
            }
          }
        })
      }
    }
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: 'CANCELLED',
      errorMessage: `Cancelada pelo usuário. Motivo: ${reason}`
    }
  })

  revalidatePath('/invoices')
  revalidatePath('/stock')
}

export async function updateTenantFiscalSettings(formData: FormData) {
  const session = await getSession()
  if (!session?.tenantId) throw new Error('Não autorizado')

  const document = formData.get('document') as string
  const ie = formData.get('ie') as string
  const im = formData.get('im') as string
  const taxRegime = formData.get('taxRegime') as string
  const cnae = formData.get('cnae') as string
  const cityIbge = formData.get('cityIbge') as string
  const nfeEnvironment = formData.get('nfeEnvironment') as string
  const nfeApiToken = formData.get('nfeApiToken') as string

  await prisma.tenant.update({
    where: { id: session.tenantId },
    data: {
      document,
      ie,
      im,
      taxRegime,
      cnae,
      cityIbge,
      nfeEnvironment,
      nfeApiToken
    }
  })

  revalidatePath('/settings')
  revalidatePath('/invoices')
}
