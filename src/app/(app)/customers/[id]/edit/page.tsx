import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User } from 'lucide-react'
import CustomerForm from '@/components/CustomerForm'

export default async function EditCustomerPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getSession()

  const customer = await prisma.customer.findUnique({
    where: { 
      id: params.id,
      tenantId: session.tenantId
    }
  })

  if (!customer) {
    notFound()
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 w-full">
      <header className="flex items-center gap-4 pb-4 border-b border-neutral-100">
        <Link 
          href="/customers" 
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors text-neutral-500"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">Editar Cliente</h1>
          <p className="text-sm text-neutral-500 mt-1">Atualize os dados cadastrais do cliente.</p>
        </div>
      </header>

      <CustomerForm initialData={customer} />
    </div>
  )
}

