'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { ZoomIn, ZoomOut, Monitor, Sparkles, Check, RotateCcw } from 'lucide-react'

export type ScalePreset = 'auto' | 'compact' | 'normal' | 'large'

interface ScaleContextType {
  preset: ScalePreset
  setPreset: (preset: ScalePreset) => void
  effectiveScale: number
  resetToAuto: () => void
  openWidget: () => void
}

const ScaleContext = createContext<ScaleContextType | undefined>(undefined)

const STORAGE_KEY = 'sergio_car_ui_scale_preset'

export function ScaleProvider({ children }: { children: React.ReactNode }) {
  const [preset, setPresetState] = useState<ScalePreset>('auto')
  const [effectiveScale, setEffectiveScale] = useState<number>(1)
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Função para calcular a escala nativa automática baseada na resolução da tela
  const calculateAutoScale = useCallback(() => {
    if (typeof window === 'undefined') return 1

    const width = window.innerWidth
    
    // Se a tela for menor que 1536px (ex: 1366px, ou 1920px com DPI de 125%/150% do Windows)
    if (width < 1536) {
      // Escala proporcional fluida
      const calculated = width / 1536
      // Limita a escala entre 0.80 (80%) e 1.0 (100%) para manter ótima legibilidade
      return Math.max(0.80, Math.min(1.0, Number(calculated.toFixed(2))))
    }
    
    // Telas Ultra-wide ou 4K muito grandes (largura > 2200px)
    if (width > 2200) {
      return 1.08
    }

    return 1.0
  }, [])

  // Aplica o valor final da escala ao CSS do documento
  const applyScale = useCallback((scaleValue: number) => {
    if (typeof document === 'undefined') return
    document.documentElement.style.setProperty('--app-scale', scaleValue.toString())
    setEffectiveScale(scaleValue)
  }, [])

  // Atualiza a escala quando o preset ou o tamanho da janela muda
  const updateScale = useCallback(() => {
    let targetScale = 1

    if (preset === 'auto') {
      targetScale = calculateAutoScale()
    } else if (preset === 'compact') {
      targetScale = 0.85
    } else if (preset === 'normal') {
      targetScale = 1.0
    } else if (preset === 'large') {
      targetScale = 1.12
    }

    applyScale(targetScale)
  }, [preset, calculateAutoScale, applyScale])

  // Inicialização e escuta de redimensionamento de janela
  useEffect(() => {
    setMounted(true)

    const savedPreset = localStorage.getItem(STORAGE_KEY) as ScalePreset | null
    if (savedPreset && ['auto', 'compact', 'normal', 'large'].includes(savedPreset)) {
      setPresetState(savedPreset)
    }

    // Recalcula ao redimensionar (ex: ao arrastar janela de um monitor para outro)
    const handleResize = () => {
      updateScale()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [updateScale])

  // Aplica escala sempre que o preset mudar
  useEffect(() => {
    if (mounted) {
      updateScale()
    }
  }, [preset, mounted, updateScale])

  const setPreset = (newPreset: ScalePreset) => {
    setPresetState(newPreset)
    localStorage.setItem(STORAGE_KEY, newPreset)
  }

  const resetToAuto = () => {
    setPreset('auto')
  }

  const openWidget = () => {
    setIsOpen(true)
  }

  const percentage = Math.round(effectiveScale * 100)

  return (
    <ScaleContext.Provider value={{ preset, setPreset, effectiveScale, resetToAuto, openWidget }}>
      {children}

      {/* Flutuante Zoom Controller (Visível apenas após montagem) */}
      {mounted && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end print:hidden">
          {/* Menu Expansível de Escala */}
          {isOpen && (
            <div className="mb-2 bg-neutral-900/95 text-white p-3 rounded-xl shadow-2xl border border-neutral-800 backdrop-blur-md w-64 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-2">
                <span className="text-[12px] font-semibold flex items-center gap-1.5 text-neutral-200">
                  <Monitor className="w-3.5 h-3.5 text-indigo-400" /> Densidade da Tela
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-[11px] text-neutral-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-neutral-800 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-1">
                {/* Opção Auto */}
                <button
                  onClick={() => setPreset('auto')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                    preset === 'auto'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Auto Adaptativo
                  </span>
                  {preset === 'auto' && <Check className="w-3.5 h-3.5" />}
                </button>

                {/* Opção Compacto (85%) */}
                <button
                  onClick={() => setPreset('compact')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                    preset === 'compact'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <ZoomOut className="w-3.5 h-3.5" /> Compacto (85%)
                  </span>
                  {preset === 'compact' && <Check className="w-3.5 h-3.5" />}
                </button>

                {/* Opção Padrão (100%) */}
                <button
                  onClick={() => setPreset('normal')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                    preset === 'normal'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Monitor className="w-3.5 h-3.5" /> Padrão (100%)
                  </span>
                  {preset === 'normal' && <Check className="w-3.5 h-3.5" />}
                </button>

                {/* Opção Ampliado (112%) */}
                <button
                  onClick={() => setPreset('large')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                    preset === 'large'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <ZoomIn className="w-3.5 h-3.5" /> Ampliado (112%)
                  </span>
                  {preset === 'large' && <Check className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="mt-2 pt-2 border-t border-neutral-800 flex items-center justify-between text-[10px] text-neutral-400">
                <span>Escala Ativa: <strong className="text-white font-mono">{percentage}%</strong></span>
                {preset !== 'auto' && (
                  <button
                    onClick={resetToAuto}
                    className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" /> Resetar Auto
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Botão Gatilho Discreto */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            title="Ajustar Densidade/Zoom da Tela"
            className="group flex items-center gap-2 bg-neutral-900/90 hover:bg-black text-white px-3 py-1.5 rounded-full shadow-lg border border-neutral-700/60 backdrop-blur-md text-[11px] font-medium transition-all duration-200 hover:scale-105"
          >
            <Monitor className="w-3.5 h-3.5 text-indigo-400 group-hover:rotate-12 transition-transform" />
            <span className="font-mono text-neutral-200">{percentage}%</span>
            <span className="text-[10px] bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400 font-semibold uppercase tracking-wider">
              {preset === 'auto' ? 'Auto' : preset}
            </span>
          </button>
        </div>
      )}
    </ScaleContext.Provider>
  )
}

export function useScale() {
  const context = useContext(ScaleContext)
  if (!context) {
    throw new Error('useScale deve ser usado dentro de um ScaleProvider')
  }
  return context
}
