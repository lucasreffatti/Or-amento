'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export type UnifiedReceptionResult = {
  success: boolean
  message: string
  data?: {
    checklistId: string
    customerId: string
    vehicleId: string
  }
}

export async function createUnifiedReception(formData: FormData): Promise<UnifiedReceptionResult> {
  try {
    const session = await getSession()
    if (!session?.tenantId) {
      return { success: false, message: 'Sessão expirada ou não autorizada.' }
    }

    const tenantId = session.tenantId

    // 1. Processar Cliente
    const customerMode = formData.get('customerMode') as string // 'EXISTING' | 'NEW'
    let customerId = formData.get('customerId') as string

    if (customerMode === 'NEW' || !customerId) {
      const name = (formData.get('customerName') as string)?.trim()
      const phone = (formData.get('customerPhone') as string)?.trim()
      const document = (formData.get('customerDocument') as string)?.trim() || null
      const email = (formData.get('customerEmail') as string)?.trim() || null

      if (!name || !phone) {
        return { success: false, message: 'Informe pelo menos o Nome e o Telefone do Cliente.' }
      }

      // Se informou documento, verifica se já existe
      if (document) {
        const existing = await prisma.customer.findFirst({
          where: { tenantId, document }
        })
        if (existing) {
          customerId = existing.id
        }
      }

      if (!customerId) {
        const newCustomer = await prisma.customer.create({
          data: {
            tenantId,
            name,
            phone,
            document,
            email,
          }
        })
        customerId = newCustomer.id
      }
    }

    // 2. Processar Veículo
    const vehicleMode = formData.get('vehicleMode') as string // 'EXISTING' | 'NEW'
    let vehicleId = formData.get('vehicleId') as string

    if (vehicleMode === 'NEW' || !vehicleId) {
      const plate = (formData.get('vehiclePlate') as string)?.trim().toUpperCase()
      const brand = (formData.get('vehicleBrand') as string)?.trim()
      const model = (formData.get('vehicleModel') as string)?.trim()
      const rawYear = formData.get('vehicleYear') as string
      const engineType = (formData.get('vehicleEngineType') as string) || 'FLEX'
      const rawMileage = formData.get('vehicleMileage') as string

      if (!plate || !brand || !model) {
        return { success: false, message: 'Informe a Placa, Marca e Modelo do Veículo.' }
      }

      // Verificar se a placa já existe no sistema
      const existingVehicle = await prisma.vehicle.findUnique({
        where: { plate }
      })

      if (existingVehicle) {
        vehicleId = existingVehicle.id
      } else {
        const newVehicle = await prisma.vehicle.create({
          data: {
            tenantId,
            customerId,
            plate,
            brand,
            model,
            year: rawYear ? parseInt(rawYear, 10) : new Date().getFullYear(),
            engineType,
            mileage: rawMileage ? parseInt(rawMileage, 10) : null,
          }
        })
        vehicleId = newVehicle.id
      }
    }

    // 3. Processar Vistoria / Checklist
    const rawFuelLevel = formData.get('fuelLevel') as string
    const fuelLevel = rawFuelLevel ? parseInt(rawFuelLevel, 10) : 50
    const reportedIssue = (formData.get('reportedIssue') as string)?.trim() || 'Sem queixas relatadas'
    const additionalInfo = (formData.get('additionalInfo') as string)?.trim() || ''
    const obd2Codes = (formData.get('obd2Codes') as string)?.trim() || ''
    const itemsStatusRaw = formData.get('itemsStatus') as string || '{}'

    let itemsStatus = {}
    try {
      itemsStatus = JSON.parse(itemsStatusRaw)
    } catch (e) {
      console.error('Invalid itemsStatus JSON', e)
    }

    const imagesUrlsRaw = (formData.get('imagesUrls') as string) || '[]'

    const checklist = await prisma.checklist.create({
      data: {
        tenantId,
        customerId,
        vehicleId,
        fuelLevel,
        reportedIssue,
        additionalInfo,
        obd2Codes,
        itemsStatus: JSON.stringify(itemsStatus),
        imagesUrls: imagesUrlsRaw,
      }
    })

    revalidatePath('/customers')
    revalidatePath(`/customers/${customerId}`)
    revalidatePath('/vehicles')
    revalidatePath('/checklists')

    return {
      success: true,
      message: 'Recepção e Vistoria registradas com sucesso!',
      data: {
        checklistId: checklist.id,
        customerId,
        vehicleId
      }
    }

  } catch (error: any) {
    console.error('[createUnifiedReception]', error)
    return {
      success: false,
      message: error?.message || 'Erro ao registrar a recepção unificada.'
    }
  }
}
