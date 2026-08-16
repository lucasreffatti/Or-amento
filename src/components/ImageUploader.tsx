'use client'

import { useState } from 'react'
import { Camera, Upload, X, Eye, Image as ImageIcon } from 'lucide-react'

interface ImageUploaderProps {
  images: string[]
  onChange: (images: string[]) => void
  maxImages?: number
}

// Comprime imagem para Base64 leve usando Canvas para evitar estouro de tamanho no envio
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 1200
        const MAX_HEIGHT = 1200
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width)
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height)
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          // Salva como WebP/JPEG comprimido (qualidade 0.75)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.75)
          resolve(dataUrl)
        } else {
          resolve(event.target?.result as string)
        }
      }
      img.onerror = (err) => reject(err)
    }
    reader.onerror = (err) => reject(err)
  })
}

export default function ImageUploader({ images, onChange, maxImages = 10 }: ImageUploaderProps) {
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsProcessing(true)
    const newImages: string[] = [...images]

    for (let i = 0; i < files.length; i++) {
      if (newImages.length >= maxImages) break
      try {
        const compressedBase64 = await compressImage(files[i])
        newImages.push(compressedBase64)
      } catch (err) {
        console.error('Erro ao processar imagem:', err)
      }
    }

    onChange(newImages)
    setIsProcessing(false)
    e.target.value = '' // reseta input file
  }

  function handleRemove(index: number) {
    const updated = images.filter((_, i) => i !== index)
    onChange(updated)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-2">
          <Camera className="w-4 h-4 text-blue-600" /> Anexar Fotos de Avarias / Registro Visual
        </label>
        <span className="text-xs font-mono text-neutral-500 font-semibold">
          {images.length} / {maxImages} foto(s)
        </span>
      </div>

      {/* ÁREA DE SELEÇÃO / UPLOAD */}
      {images.length < maxImages && (
        <label className="border-2 border-dashed border-neutral-300 hover:border-black bg-neutral-50 hover:bg-neutral-100/80 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all group text-center">
          <input
            type="file"
            multiple
            accept="image/*,image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isProcessing}
          />
          <div className="w-12 h-12 rounded-full bg-white border border-neutral-200 shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Upload className="w-5 h-5 text-neutral-600 group-hover:text-black" />
          </div>
          <p className="text-sm font-semibold text-neutral-900">
            {isProcessing ? 'Processando fotos...' : 'Clique para tirar foto ou selecionar da galeria'}
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            Formatos aceitos: JPG, PNG, WEBP, HEIC, GIF (compatibilidade total).
          </p>
        </label>
      )}

      {/* GALERIA DE THUMBNAILS PREVIEW */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {images.map((img, idx) => (
            <div key={idx} className="relative group rounded-xl overflow-hidden border border-neutral-200 aspect-video bg-black/5 shadow-xs">
              <img
                src={img}
                alt={`Avaria ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPreview(img)}
                  className="w-8 h-8 rounded-full bg-white/90 text-black flex items-center justify-center hover:bg-white transition-colors"
                  title="Expandir Foto"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="w-8 h-8 rounded-full bg-red-600/90 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                  title="Remover Foto"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <span className="absolute bottom-1 left-1.5 bg-black/70 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded">
                Foto #{idx + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* MODAL PREVIEW DA FOTO SELECIONADA */}
      {selectedPreview && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPreview(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2">
            <button
              onClick={() => setSelectedPreview(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 bg-black/70 hover:bg-black text-white rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedPreview}
              alt="Visualização expandida"
              className="max-w-full max-h-[80vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  )
}
