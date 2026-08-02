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

export async function createInvoiceFromBudget(budgetId: string, type: string = 'COMBINED'): Promise<ActionState> {
  try {
    const session = await getSession()
    if (!session?.tenantId) return { success: false, message: 'Não autorizado' }

    if (!budgetId || typeof budgetId !== 'string') {
      return { success: false, message: 'Orçamento não informado.' }
    }

    const budget = await prisma.budget.findUnique({
      where: { id: budgetId, tenantId: session.tenantId },
      include: {
        items: {
          include: { stockItem: true }
        },
        customer: true
      }
    })

    if (!budget) return { success: false, message: 'Orçamento não encontrado.' }

    // Verifica se já existe nota para este orçamento
    const existingInvoice = await prisma.invoice.findUnique({
      where: { budgetId, tenantId: session.tenantId }
    })

    if (existingInvoice) {
      return { success: false, message: 'Nota fiscal já existente para este orçamento.', data: { redirectUrl: '/invoices' } }
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

    await prisma.invoice.create({
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
    return { success: true, message: 'Nota fiscal criada (Rascunho) com sucesso.', data: { redirectUrl: '/invoices' } }
  } catch (error: any) {
    console.error('[createInvoiceFromBudget]', error)
    return { success: false, message: 'Erro ao gerar nota fiscal.' }
  }
}

export async function transmitInvoice(invoiceId: string): Promise<ActionState> {
  try {
    const session = await getSession()
    if (!session?.tenantId) return { success: false, message: 'Não autorizado' }

    if (!invoiceId) return { success: false, message: 'ID da nota não informado.' }

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

    if (!invoice) return { success: false, message: 'Nota fiscal não encontrada.' }
    if (invoice.status === 'AUTHORIZED') return { success: false, message: 'A Nota Fiscal já está autorizada!' }

    // 1. Dar baixa no Estoque em tempo real para todos os itens do tipo PART vinculados
    if (invoice.budget?.items) {
      for (const item of invoice.budget.items) {
        // Apenas baixa estoque se for uma peça e se for de estoque FIXO
        // Isso previne que peças encomendadas fiquem com saldo negativo
        if (item.type === 'PART' && item.stockItemId && item.stockItem?.itemType === 'FIXO') {
          await prisma.stockItem.update({
            where: { id: item.stockItemId, tenantId: session.tenantId },
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

    await prisma.invoice.update({
      where: { id: invoiceId, tenantId: session.tenantId },
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
    revalidatePath('/stock') // Atualizou estoque

    return { success: true, message: 'Nota Fiscal autorizada pela SEFAZ com sucesso!' }
  } catch (error: any) {
    console.error('[transmitInvoice]', error)
    return { success: false, message: 'Erro na transmissão para a SEFAZ.' }
  }
}

export async function cancelInvoice(invoiceId: string, reason?: string): Promise<ActionState> {
  // Stub function for cancelling an invoice
  try {
    const session = await getSession()
    if (!session?.tenantId) return { success: false, message: 'Não autorizado' }

    await prisma.invoice.update({
      where: { id: invoiceId, tenantId: session.tenantId },
      data: { status: 'CANCELLED' } // In a real scenario we'd save the reason
    })
    
    revalidatePath('/invoices')
    return { success: true, message: 'Nota fiscal cancelada com sucesso.' }
  } catch (error) {
    console.error('[cancelInvoice]', error)
    return { success: false, message: 'Erro ao cancelar a nota.' }
  }
}

export async function updateTenantFiscalSettings(formData: FormData): Promise<void> {
  // Stub function for saving fiscal settings
  const session = await getSession()
  if (!session?.tenantId) throw new Error('Não autorizado')

  // logic would go here
  revalidatePath('/settings')
}
