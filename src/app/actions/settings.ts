'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function updateSettings(formData: FormData) {
  const session = await getSession()
  const name = formData.get('name') as string

  if (!name) {
    throw new Error('O nome da empresa é obrigatório.')
  }

  await prisma.tenant.update({
    where: { id: session.tenantId },
    data: { name }
  })

  revalidatePath('/')
  revalidatePath('/settings')
}
