import { cookies } from 'next/headers'

// Mock de sessão para o MVP
// Na versão de produção, isso seria substituído por NextAuth.js ou similar.
export async function getSession() {
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('mock_tenant_id')?.value
  const userId = cookieStore.get('mock_user_id')?.value

  // Se não tiver cookie (ex: primeiro acesso no MVP), vamos usar um mock fixo,
  // ou poderíamos retornar null para forçar login.
  // Como é um MVP rápido, vou retornar um id fixo "tenant-1" e "user-1" se não existir.
  return {
    tenantId: tenantId || 'tenant-1',
    userId: userId || 'user-1',
    role: 'ADMIN'
  }
}
