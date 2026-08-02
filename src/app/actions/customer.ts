'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

// Senior Full Stack: Zod Validation
const CustomerSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  document: z.string().nullable().optional(),
  phone: z.string().min(8, "Telefone inválido"),
  email: z.string().email("E-mail inválido").nullable().optional().or(z.literal('')),
})

type ActionState = {
  success: boolean
  message: string
  data?: any
}

export async function createCustomer(formData: FormData): Promise<ActionState> {
  try {
    const session = await getSession()
    if (!session?.tenantId) {
      return { success: false, message: 'Não autorizado.' }
    }

    const data = {
      name: formData.get('name') as string,
      document: formData.get('document') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
    }

    const validatedData = CustomerSchema.safeParse(data)
    if (!validatedData.success) {
      return { success: false, message: validatedData.error.issues[0].message }
    }

    const customer = await prisma.customer.create({
      data: {
        ...validatedData.data,
        email: validatedData.data.email || null,
        document: validatedData.data.document || null,
        tenantId: session.tenantId
      }
    })

    revalidatePath('/customers')
    return { 
      success: true, 
      message: 'Cliente criado com sucesso!',
      data: { redirectUrl: '/customers' }
    }
  } catch (error) {
    console.error('[createCustomer]', error)
    return { success: false, message: 'Erro ao criar cliente. Verifique se o documento já está cadastrado.' }
  }
}

export async function updateCustomer(id: string, formData: FormData): Promise<ActionState> {
  try {
    const session = await getSession()
    if (!session?.tenantId) {
      return { success: false, message: 'Não autorizado.' }
    }

    const data = {
      name: formData.get('name') as string,
      document: formData.get('document') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
    }

    const validatedData = CustomerSchema.safeParse(data)
    if (!validatedData.success) {
      return { success: false, message: validatedData.error.issues[0].message }
    }

    await prisma.customer.update({
      where: { 
        id,
        tenantId: session.tenantId
      },
      data: {
        ...validatedData.data,
        email: validatedData.data.email || null,
        document: validatedData.data.document || null,
      }
    })

    revalidatePath('/customers')
    revalidatePath(`/customers/${id}`)
    
    return { 
      success: true, 
      message: 'Cliente atualizado com sucesso!',
      data: { redirectUrl: `/customers/${id}` }
    }
  } catch (error) {
    console.error('[updateCustomer]', error)
    return { success: false, message: 'Erro ao atualizar cliente.' }
  }
}
