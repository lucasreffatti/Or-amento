import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { Settings, Building2, HardDrive, Shield, Receipt, Key, FileCheck } from 'lucide-react'
import { updateSettings } from '@/app/actions/settings'
import { updateTenantFiscalSettings } from '@/app/actions/invoice'

export default async function SettingsPage() {
  const session = await getSession()
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId }
  })

  if (!tenant) return null

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-4 w-full">
      <header className="pb-6 border-b border-neutral-200/60">
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-neutral-400" /> Configurações
        </h1>
        <p className="text-[13px] text-neutral-500 mt-1">Gerencie os dados da sua oficina, parâmetros fiscais e preferências do sistema.</p>
      </header>

      {/* Dados Principais da Empresa */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-1 text-[13px]">
          <h2 className="font-semibold text-neutral-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-neutral-500" /> Dados da Empresa
          </h2>
          <p className="text-neutral-500">
            Informações que aparecerão em orçamentos, recibos e no sistema.
          </p>
        </div>

        <div className="md:col-span-2">
          <form action={updateSettings} className="bg-white border border-neutral-200/80 rounded-xl shadow-sm p-6 space-y-6">
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-neutral-700">Nome Fantasia / Razão Social</label>
              <input 
                required 
                type="text" 
                name="name" 
                defaultValue={tenant.name}
                className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-md text-[13px] text-neutral-900 outline-none focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/5 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-neutral-700">CNPJ</label>
                <input 
                  type="text" 
                  name="document"
                  defaultValue={tenant.document || ''}
                  placeholder="00.000.000/0001-00"
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-md text-[13px] text-neutral-900 outline-none focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/5 transition-all font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-neutral-700">Telefone / WhatsApp</label>
                <input 
                  type="text" 
                  name="phone"
                  defaultValue={tenant.phone || ''}
                  placeholder="(00) 00000-0000"
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-md text-[13px] text-neutral-900 outline-none focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/5 transition-all font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-neutral-700">Endereço Completo</label>
              <input 
                type="text" 
                name="address"
                defaultValue={tenant.address || ''}
                placeholder="Ex: Rua Jacob Weingartner, 4198 - Centro - CEP 88131-400 - Palhoça/SC"
                className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-md text-[13px] text-neutral-900 outline-none focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/5 transition-all"
              />
            </div>

            <div className="pt-4 border-t border-neutral-100 flex justify-end">
              <button 
                type="submit" 
                className="bg-neutral-900 text-white px-5 py-2.5 rounded-lg text-[13px] font-medium shadow-[0_2px_10px_rgba(0,0,0,0.08)] hover:bg-neutral-800 transition-colors"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      </div>

      <hr className="border-neutral-200/60" />

      {/* Parâmetros Fiscais & Integração de Nota Fiscal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-1 text-[13px]">
          <h2 className="font-semibold text-neutral-900 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-blue-600" /> Parâmetros Fiscais (NF-e / NFS-e)
          </h2>
          <p className="text-neutral-500">
            Regime Tributário, Inscrições e Token da API de emissão de Nota Fiscal Eletrônica.
          </p>
        </div>

        <div className="md:col-span-2">
          <form action={updateTenantFiscalSettings} className="bg-white border border-neutral-200/80 rounded-xl shadow-sm p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-neutral-700">Inscrição Estadual (IE)</label>
                <input 
                  type="text" 
                  name="ie"
                  defaultValue={tenant.ie || ''}
                  placeholder="Ex: 123.456.789"
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-md text-[13px] text-neutral-900 outline-none focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/5 transition-all font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-neutral-700">Inscrição Municipal (IM)</label>
                <input 
                  type="text" 
                  name="im"
                  defaultValue={tenant.im || ''}
                  placeholder="Ex: 987654"
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-md text-[13px] text-neutral-900 outline-none focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/5 transition-all font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-neutral-700">Regime Tributário</label>
                <select
                  name="taxRegime"
                  defaultValue={tenant.taxRegime || 'SIMPLES_NACIONAL'}
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-md text-[13px] text-neutral-900 outline-none focus:border-neutral-400 focus:ring-4"
                >
                  <option value="SIMPLES_NACIONAL">1 - Simples Nacional</option>
                  <option value="REGIME_NORMAL">3 - Regime Normal (Lucro Presumido/Real)</option>
                  <option value="MEI">4 - MEI (Microempreendedor)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-neutral-700">Código CNAE Principal</label>
                <input 
                  type="text" 
                  name="cnae"
                  defaultValue={tenant.cnae || '4520-0/01'}
                  placeholder="4520-0/01"
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-md text-[13px] text-neutral-900 outline-none focus:border-neutral-400 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-neutral-700">Cód. IBGE Município</label>
                <input 
                  type="text" 
                  name="cityIbge"
                  defaultValue={tenant.cityIbge || '4211900'}
                  placeholder="4211900 (Palhoça/SC)"
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-md text-[13px] text-neutral-900 outline-none focus:border-neutral-400 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-neutral-700">Ambiente Fiscal (SEFAZ)</label>
                <select
                  name="nfeEnvironment"
                  defaultValue={tenant.nfeEnvironment || 'HOMOLOGATION'}
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-md text-[13px] text-neutral-900 outline-none focus:border-neutral-400 font-semibold"
                >
                  <option value="HOMOLOGATION">Ambiente de Homologação (Testes)</option>
                  <option value="PRODUCTION">Ambiente de Produção (Válido SEFAZ)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-neutral-700 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-blue-600" /> Token da API Fiscal (FocusNFe / PlugNotas / e-Notas)
                </label>
                <input 
                  type="password" 
                  name="nfeApiToken"
                  defaultValue={tenant.nfeApiToken || ''}
                  placeholder="Cole aqui seu Token de API..."
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-md text-[13px] text-neutral-900 outline-none focus:border-neutral-400 font-mono"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-100 flex justify-end">
              <button 
                type="submit" 
                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-[13px] font-medium shadow-[0_2px_10px_rgba(37,99,235,0.2)] hover:bg-blue-500 transition-colors"
              >
                Salvar Parâmetros Fiscais
              </button>
            </div>
          </form>
        </div>
      </div>

      <hr className="border-neutral-200/60" />

      {/* Infraestrutura */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-1 text-[13px]">
          <h2 className="font-semibold text-neutral-900 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-neutral-500" /> Infraestrutura e Dados
          </h2>
          <p className="text-neutral-500">
            Gerenciamento de recursos e informações de acesso.
          </p>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white border border-neutral-200/80 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-neutral-900">Banco de Dados</p>
                <p className="text-[12px] text-neutral-500">Conexão Prisma / Supabase</p>
              </div>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest flex items-center gap-1">
                Conectado
              </span>
            </div>
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-neutral-900">Isolamento Multi-Tenant</p>
                <p className="text-[12px] text-neutral-500">ID: {session.tenantId}</p>
              </div>
              <Shield className="w-4 h-4 text-indigo-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
