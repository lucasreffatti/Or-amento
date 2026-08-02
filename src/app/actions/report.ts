'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const ReportFilterSchema = z.object({
  period: z.enum(['today', 'month', 'year', 'custom']),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  category: z.enum(['all', 'budgets', 'invoices', 'checklists', 'stock', 'customers']).default('all'),
})

export type ReportFilterInput = z.infer<typeof ReportFilterSchema>

export async function getReportData(input: ReportFilterInput) {
  try {
    const session = await getSession()
    if (!session?.tenantId) {
      return { success: false, error: 'Não autorizado' }
    }

    const tenantId = session.tenantId
    const validated = ReportFilterSchema.parse(input)

    // Determinar janela de datas
    let start = new Date()
    let end = new Date()

    const now = new Date()

    if (validated.period === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    } else if (validated.period === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    } else if (validated.period === 'year') {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0)
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
    } else if (validated.period === 'custom' && validated.startDate && validated.endDate) {
      start = new Date(`${validated.startDate}T00:00:00`)
      end = new Date(`${validated.endDate}T23:59:59`)
    } else {
      // Fallback para o mês atual
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    }

    const dateFilter = {
      gte: start,
      lte: end,
    }

    // Busca das informações por categoria
    const [tenant, budgets, invoices, checklists, stockItems, customers] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true, phone: true, document: true, address: true }
      }),

      // Orçamentos no período
      prisma.budget.findMany({
        where: {
          tenantId,
          createdAt: dateFilter
        },
        include: {
          customer: { select: { name: true, phone: true } },
          vehicle: { select: { plate: true, brand: true, model: true } },
          items: true
        },
        orderBy: { createdAt: 'desc' }
      }),

      // Notas Fiscais no período
      prisma.invoice.findMany({
        where: {
          tenantId,
          createdAt: dateFilter
        },
        include: {
          customer: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),

      // Checklists no período
      prisma.checklist.findMany({
        where: {
          tenantId,
          createdAt: dateFilter
        },
        include: {
          customer: { select: { name: true } },
          vehicle: { select: { plate: true, model: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),

      // Estoque (Lista geral com saldo e itens rotativos)
      prisma.stockItem.findMany({
        where: { tenantId },
        orderBy: { description: 'asc' }
      }),

      // Clientes cadastrados no período
      prisma.customer.findMany({
        where: {
          tenantId,
          createdAt: dateFilter
        },
        include: {
          vehicles: true,
          _count: { select: { budgets: true } }
        },
        orderBy: { createdAt: 'desc' }
      })
    ])

    // Cálculos Financeiros e Operacionais
    const approvedBudgets = budgets.filter(b => b.status === 'APPROVED')
    const pendingBudgets = budgets.filter(b => b.status === 'DRAFT' || b.status === 'SENT')
    const rejectedBudgets = budgets.filter(b => b.status === 'REJECTED')

    const totalApprovedRevenue = approvedBudgets.reduce((acc, b) => acc + (b.finalTotal || 0), 0)
    const totalPendingRevenue = pendingBudgets.reduce((acc, b) => acc + (b.finalTotal || 0), 0)
    const averageTicket = approvedBudgets.length > 0 ? totalApprovedRevenue / approvedBudgets.length : 0

    const authorizedInvoices = invoices.filter(i => i.status === 'AUTHORIZED')
    const totalInvoicedAmount = authorizedInvoices.reduce((acc, i) => acc + (i.finalTotal || 0), 0)

    const totalFixedStockValue = stockItems
      .filter(i => i.itemType === 'FIXO')
      .reduce((acc, i) => acc + (i.quantity * i.salePrice), 0)

    return {
      success: true,
      data: {
        tenant,
        periodInfo: {
          period: validated.period,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
        summary: {
          totalBudgets: budgets.length,
          approvedCount: approvedBudgets.length,
          pendingCount: pendingBudgets.length,
          rejectedCount: rejectedBudgets.length,
          totalApprovedRevenue,
          totalPendingRevenue,
          averageTicket,
          totalChecklists: checklists.length,
          totalInvoices: invoices.length,
          totalInvoicedAmount,
          totalCustomers: customers.length,
          totalStockItems: stockItems.length,
          totalFixedStockValue,
        },
        budgets,
        invoices,
        checklists,
        stockItems,
        customers,
      }
    }

  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    return { success: false, error: 'Falha ao processar os dados do relatório' }
  }
}
