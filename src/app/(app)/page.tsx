import { ArrowUpRight, Clock, FileText, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react'

export default async function Dashboard() {
  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-neutral-200/60">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Dashboard
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">Visão Geral</h1>
          <p className="text-[13px] text-neutral-500 mt-1">Bem-vindo à OficinaSaaS. Aqui está o resumo operacional em tempo real.</p>
        </div>
        <div className="font-mono text-[11px] font-medium bg-white border border-neutral-200 px-3 py-2 rounded-md text-neutral-600 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-white border border-neutral-200/80 p-6 rounded-xl flex flex-col justify-between shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:border-neutral-300 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
              Serviços Pendentes
            </span>
            <ArrowUpRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-900 transition-colors" />
          </div>
          <div className="mt-8 flex items-end justify-between">
            <span className="text-4xl font-semibold tracking-tighter text-neutral-900">12</span>
            <span className="text-[11px] font-medium text-neutral-500 font-mono">Últimos 7 dias</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-neutral-200/80 p-6 rounded-xl flex flex-col justify-between shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:border-neutral-300 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              Checklists
            </span>
            <ArrowUpRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-900 transition-colors" />
          </div>
          <div className="mt-8 flex items-end justify-between">
            <span className="text-4xl font-semibold tracking-tighter text-neutral-900">45</span>
            <span className="text-[11px] font-medium text-neutral-500 font-mono">Neste mês</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-neutral-200/80 p-6 rounded-xl flex flex-col justify-between shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:border-neutral-300 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5" />
              </div>
              Receita Estimada
            </span>
            <ArrowUpRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-900 transition-colors" />
          </div>
          <div className="mt-8 flex items-end justify-between">
            <span className="text-3xl font-semibold tracking-tighter text-neutral-900">R$ 14,2k</span>
            <span className="text-[11px] text-emerald-600 font-mono font-medium bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +12%
            </span>
          </div>
        </div>
      </div>
      
      <div className="border border-neutral-200/80 bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="px-6 py-5 border-b border-neutral-100 flex justify-between items-center bg-white">
          <h2 className="text-[14px] font-semibold text-neutral-900 tracking-tight">Atividades Recentes</h2>
          <button className="text-[12px] font-semibold text-neutral-500 hover:text-neutral-900 transition-colors flex items-center gap-1.5">
            Ver relatório completo <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="p-16 flex flex-col items-center justify-center gap-4 bg-neutral-50/30">
          <div className="w-12 h-12 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center">
            <Clock className="w-5 h-5 text-neutral-400" />
          </div>
          <p className="text-[13px] text-neutral-500">Nenhuma atividade registrada no momento.</p>
        </div>
      </div>
    </div>
  )
}
