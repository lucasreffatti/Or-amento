'use client'

import { useState, useEffect } from 'react'
import { X, ZoomIn, ZoomOut, RotateCw, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react'

interface PhotoLightboxModalProps {
  images: string[]
  currentIndex: number
  onClose: () => void
  onNavigate?: (index: number) => void
}

export default function PhotoLightboxModal({
  images,
  currentIndex,
  onClose,
  onNavigate
}: PhotoLightboxModalProps) {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [activeIdx, setActiveIdx] = useState(currentIndex)

  useEffect(() => {
    setActiveIdx(currentIndex)
    setScale(1)
    setRotation(0)
  }, [currentIndex])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' && activeIdx < images.length - 1) {
        handleNext()
      }
      if (e.key === 'ArrowLeft' && activeIdx > 0) {
        handlePrev()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeIdx, images.length])

  const currentImage = images[activeIdx]

  function handleZoomIn() {
    setScale(prev => Math.min(prev + 0.3, 4))
  }

  function handleZoomOut() {
    setScale(prev => Math.max(prev - 0.3, 0.6))
  }

  function handleRotate() {
    setRotation(prev => (prev + 90) % 360)
  }

  function handleReset() {
    setScale(1)
    setRotation(0)
  }

  function handleNext() {
    if (activeIdx < images.length - 1) {
      const nextIdx = activeIdx + 1
      setActiveIdx(nextIdx)
      setScale(1)
      setRotation(0)
      if (onNavigate) onNavigate(nextIdx)
    }
  }

  function handlePrev() {
    if (activeIdx > 0) {
      const prevIdx = activeIdx - 1
      setActiveIdx(prevIdx)
      setScale(1)
      setRotation(0)
      if (onNavigate) onNavigate(prevIdx)
    }
  }

  if (!currentImage) return null

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* BARRA SUPERIOR DE CONTROLES */}
      <div 
        className="w-full flex items-center justify-between z-20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-white text-xs font-mono font-semibold bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
          Foto {activeIdx + 1} de {images.length}
        </div>

        <div className="flex items-center gap-2 bg-neutral-900/90 border border-neutral-700/60 rounded-full p-1.5 shadow-xl">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 hover:bg-neutral-800 text-neutral-200 hover:text-white rounded-full transition-colors"
            title="Aumentar Zoom (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 hover:bg-neutral-800 text-neutral-200 hover:text-white rounded-full transition-colors"
            title="Diminuir Zoom (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRotate}
            className="p-2 hover:bg-neutral-800 text-neutral-200 hover:text-white rounded-full transition-colors"
            title="Girar Imagem"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-2.5 py-1 text-xs font-mono font-bold hover:bg-neutral-800 text-neutral-200 hover:text-white rounded-full transition-colors"
            title="Resetar Zoom"
          >
            {Math.round(scale * 100)}%
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 bg-white/10 hover:bg-red-600 text-white rounded-full flex items-center justify-center border border-white/20 transition-all shadow-lg hover:scale-105"
          title="Fechar (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ÁREA DA IMAGEM CENTRAL */}
      <div 
        className="flex-1 relative flex items-center justify-center overflow-hidden my-4"
        onClick={onClose}
      >
        {/* Seta Esquerda */}
        {images.length > 1 && activeIdx > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handlePrev()
            }}
            className="absolute left-2 sm:left-6 z-20 w-12 h-12 bg-black/60 hover:bg-black text-white rounded-full flex items-center justify-center border border-white/20 transition-all hover:scale-110 shadow-2xl"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Container da Foto com Transform */}
        <div 
          className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-200 ease-out"
          onClick={(e) => e.stopPropagation()}
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`
          }}
        >
          <img
            src={currentImage}
            alt={`Visualização da Foto ${activeIdx + 1}`}
            className="max-w-[90vw] max-h-[75vh] object-contain rounded-lg shadow-2xl select-none"
            draggable={false}
          />
        </div>

        {/* Seta Direita */}
        {images.length > 1 && activeIdx < images.length - 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleNext()
            }}
            className="absolute right-2 sm:right-6 z-20 w-12 h-12 bg-black/60 hover:bg-black text-white rounded-full flex items-center justify-center border border-white/20 transition-all hover:scale-110 shadow-2xl"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* BARRA INFERIOR DE NAVEGAÇÃO / DICAS */}
      <div 
        className="w-full flex items-center justify-center gap-2 z-20 overflow-x-auto pb-1"
        onClick={(e) => e.stopPropagation()}
      >
        {images.length > 1 && images.map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              setActiveIdx(i)
              setScale(1)
              setRotation(0)
              if (onNavigate) onNavigate(i)
            }}
            className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
              i === activeIdx ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'
            }`}
          >
            <img src={img} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}
