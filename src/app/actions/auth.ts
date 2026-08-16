'use server'

import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/auth'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'

export async function loginAction(formData: FormData) {
  try {
    const rawUsername = formData.get('username') as string
    const rawPassword = formData.get('password') as string

    if (!rawUsername?.trim() || !rawPassword?.trim()) {
      return { success: false, error: 'Por favor, informe o usuário e a senha.' }
    }

    const username = rawUsername.trim().toLowerCase()
    const password = rawPassword.trim()

    // 1. Busca o usuário pelo username
    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      return { success: false, error: 'Usuário ou senha incorretos.' }
    }

    if (!user.password) {
      return { success: false, error: 'Senha não configurada para este usuário.' }
    }

    const passwordMatch = await bcrypt.compare(password, user.password)
    
    if (!passwordMatch) {
      return { success: false, error: 'Usuário ou senha incorretos.' }
    }

    // 2. Senha válida, cria a payload da sessão
    const sessionPayload = {
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      username: user.username,
    }

    const session = await encrypt(sessionPayload)

    const cookieStore = await cookies()
    cookieStore.set('saas_session', session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 horas
    })

    return { success: true }
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error
    }
    console.error('Erro detalhado na ação de login:', error)
    return { 
      success: false, 
      error: error?.message || 'Erro inesperado ao realizar o login.' 
    }
  }
}

export async function registerAction(formData: FormData) {
  try {
    const name = (formData.get('name') as string)?.trim()
    const rawUsername = (formData.get('username') as string)?.trim()
    const password = (formData.get('password') as string)?.trim()
    const accessCode = (formData.get('accessCode') as string)?.trim()

    if (!name || !rawUsername || !password || !accessCode) {
      return { success: false, error: 'Todos os campos são obrigatórios.' }
    }

    const username = rawUsername.toLowerCase()

    // Validação estrita do código no servidor
    const SECRET_ACCESS_CODE = 'Lucas15032003.'
    
    if (accessCode !== SECRET_ACCESS_CODE) {
      return { success: false, error: 'Código de autorização inválido.' }
    }

    // Verifica se username já existe
    const existing = await prisma.user.findUnique({
      where: { username }
    })

    if (existing) {
      return { success: false, error: 'Este nome de usuário já está cadastrado.' }
    }

    // Garante que o tenant-1 padrão existe
    let tenant = await prisma.tenant.findUnique({ where: { id: 'tenant-1' } })
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          id: 'tenant-1',
          name: 'Oficina Principal',
        }
      })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.user.create({
      data: {
        name,
        username,
        password: passwordHash,
        role: 'ADMIN',
        tenantId: tenant.id
      }
    })

    return { success: true }
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error
    }
    console.error('Erro detalhado na ação de registro:', error)
    return { 
      success: false, 
      error: error?.message || 'Erro inesperado ao registrar usuário.' 
    }
  }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('saas_session')
  redirect('/login')
}
