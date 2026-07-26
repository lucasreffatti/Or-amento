import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Car } from 'lucide-react'

export default async function NewVehiclePage() {
  const session = await getSession()
  
  // Get customers to link the vehicle to an owner
  const customers = await prisma.customer.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { name: 'asc' }
  })

  async function createVehicle(formData: FormData) {
    'use server'
    const customerId = formData.get('customerId') as string
    const plate = (formData.get('plate') as string).toUpperCase()
    const brand = formData.get('brand') as string
    const model = formData.get('model') as string
    const year = parseInt(formData.get('year') as string, 10)
    const engineType = formData.get('engineType') as string
    const mileageStr = formData.get('mileage') as string
    const mileage = mileageStr ? parseInt(mileageStr, 10) : null
    
    const tenant = await prisma.tenant.findFirst()
    
    if (tenant) {
      await prisma.vehicle.create({
        data: {
          tenantId: tenant.id,
          customerId,
          plate,
          brand,
          model,
          year,
          engineType,
          mileage
        }
      })
    }
    
    revalidatePath('/vehicles')
    redirect('/vehicles')
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-2xl">
      <header className="flex items-center gap-4 pb-4 border-b border-neutral-100">
        <Link 
          href="/vehicles" 
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors text-neutral-500"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">Novo Veículo</h1>
          <p className="text-sm text-neutral-500 mt-1">Cadastre um novo veículo e vincule a um cliente.</p>
        </div>
      </header>

      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-neutral-100">
          <div className="w-10 h-10 bg-neutral-50 rounded-full border border-neutral-200 flex items-center justify-center">
            <Car className="w-5 h-5 text-neutral-400" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-neutral-900">Informações do Veículo</h2>
            <p className="text-xs text-neutral-500">Dados cadastrais da frota</p>
          </div>
        </div>

        {customers.length === 0 ? (
          <div className="py-8 text-center bg-neutral-50 border border-neutral-100 rounded-md">
            <p className="text-sm text-neutral-600 font-medium">Falta cliente</p>
            <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
              Para cadastrar um veículo, você precisa ter pelo menos 1 cliente cadastrado no sistema.
            </p>
            <div className="mt-4 flex justify-center">
              <Link href="/customers/new" className="text-xs font-medium text-blue-600 hover:underline">
                Cadastrar Cliente
              </Link>
            </div>
          </div>
        ) : (
          <form action={createVehicle} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              <div className="space-y-1.5 sm:col-span-2">
                <label htmlFor="customerId" className="text-[13px] font-medium text-neutral-700">Proprietário (Cliente) *</label>
                <select 
                  id="customerId" 
                  name="customerId" 
                  required
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-md text-sm outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-all text-neutral-900"
                >
                  <option value="">Selecione o proprietário...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="plate" className="text-[13px] font-medium text-neutral-700">Placa *</label>
                <input 
                  type="text" 
                  id="plate" 
                  name="plate" 
                  required
                  placeholder="ABC-1234"
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-md text-sm outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-all placeholder:text-neutral-400 font-mono uppercase"
                />
              </div>
              
              <div className="space-y-1.5">
                <label htmlFor="brand" className="text-[13px] font-medium text-neutral-700">Marca *</label>
                <input 
                  type="text" 
                  id="brand" 
                  name="brand" 
                  required
                  placeholder="Ex: Toyota"
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-md text-sm outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-all placeholder:text-neutral-400"
                />
              </div>
              
              <div className="space-y-1.5">
                <label htmlFor="model" className="text-[13px] font-medium text-neutral-700">Modelo *</label>
                <input 
                  type="text" 
                  id="model" 
                  name="model" 
                  required
                  placeholder="Ex: Corolla XEI"
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-md text-sm outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-all placeholder:text-neutral-400"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="year" className="text-[13px] font-medium text-neutral-700">Ano *</label>
                <input 
                  type="number" 
                  id="year" 
                  name="year" 
                  required
                  min="1950"
                  max={new Date().getFullYear() + 1}
                  placeholder="Ex: 2020"
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-md text-sm outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-all placeholder:text-neutral-400 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="engineType" className="text-[13px] font-medium text-neutral-700">Motor/Combustível *</label>
                <select 
                  id="engineType" 
                  name="engineType" 
                  required
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-md text-sm outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-all text-neutral-900"
                >
                  <option value="FLEX">Flex</option>
                  <option value="GASOLINE">Gasolina</option>
                  <option value="ALCOHOL">Álcool</option>
                  <option value="DIESEL">Diesel</option>
                  <option value="HYBRID">Híbrido</option>
                  <option value="ELECTRIC">Elétrico</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="mileage" className="text-[13px] font-medium text-neutral-700">Quilometragem</label>
                <input 
                  type="number" 
                  id="mileage" 
                  name="mileage" 
                  placeholder="Ex: 45000"
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-md text-sm outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-all placeholder:text-neutral-400 font-mono"
                />
              </div>

            </div>

            <div className="pt-6 mt-6 border-t border-neutral-100 flex justify-end gap-3">
              <Link 
                href="/vehicles" 
                className="px-4 py-2 text-sm font-medium text-neutral-600 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors"
              >
                Cancelar
              </Link>
              <button 
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-md hover:bg-neutral-800 transition-colors shadow-sm"
              >
                Salvar Veículo
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
