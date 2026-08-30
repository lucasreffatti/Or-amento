'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

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

  // Função para calcular a escala nativa automática baseada na resolução da tela e zoom do navegador
  const calculateAutoScale = useCallback(() => {
    if (typeof window === 'undefined') return 1

    const width = window.innerWidth
    
    // Dispositivos móveis e celulares (largura < 768px): layout mobile nativo (escala 100% para não encolher a tela)
    if (width < 768) {
      return 1.0
    }

    // Se a largura for menor que 1536px (devido a resolução menor ou zoom in do navegador como 125%, 150%, 175%)
    if (width < 1536) {
      // Escala proporcional fluida calculada a partir dos 1536px de referência
      const calculated = width / 1536
      // Permite recuo suave de escala até 0.75 (75%) para evitar que conteúdos invadam as bordas no desktop
      return Math.max(0.75, Math.min(1.0, Number(calculated.toFixed(2))))
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

  // Inicialização e escuta de redimensionamento e zoom do navegador
  useEffect(() => {
    setMounted(true)

    const savedPreset = localStorage.getItem(STORAGE_KEY) as ScalePreset | null
    if (savedPreset && ['auto', 'compact', 'normal', 'large'].includes(savedPreset)) {
      setPresetState(savedPreset)
    }

    // Recalcula ao redimensionar ou alterar o zoom do navegador
    const handleResize = () => {
      updateScale()
    }

    window.addEventListener('resize', handleResize)

    // Escutar diretamente alterações de devicePixelRatio (Zoom Ctrl+ / Ctrl-)
    let dprMediaQuery: MediaQueryList | null = null
    const setupDprListener = () => {
      if (dprMediaQuery) {
        dprMediaQuery.removeEventListener('change', handleDprChange)
      }
      dprMediaQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`)
      dprMediaQuery.addEventListener('change', handleDprChange)
    }

    const handleDprChange = () => {
      updateScale()
      setupDprListener()
    }

    setupDprListener()

    // Suporte para visualViewport (redimensionamento por zoom em qualquer plataforma)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize)
    }

    return () => {
      window.removeEventListener('resize', handleResize)
      if (dprMediaQuery) dprMediaQuery.removeEventListener('change', handleDprChange)
      if (window.visualViewport) window.visualViewport.removeEventListener('resize', handleResize)
    }
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

  const openWidget = () => {}

  const percentage = Math.round(effectiveScale * 100)

  return (
    <ScaleContext.Provider value={{ preset, setPreset, effectiveScale, resetToAuto, openWidget }}>
      {children}
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
