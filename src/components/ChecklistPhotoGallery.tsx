'use client'

import { useState } from 'react'
import { Camera, Eye } from 'lucide-react'
import PhotoLightboxModal from './PhotoLightboxModal'

interface ChecklistPhotoGalleryProps {
  images: string[]
}

export default function ChecklistPhotoGallery({ images }: ChecklistPhotoGalleryProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null)

  if (!images || images.length === 0) return null

  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
        <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
          <Camera className="w-4 h-4 text-blue-600" /> Fotos de Avarias e Registro Visual ({images.length})
        </h3>
        <span className="text-[11px] text-neutral-400 font-medium">Clique na foto para ampliar</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map((imgUrl, i) => (
          <div
            key={i}
            onClick={() => setActiveIdx(i)}
            className="relative group aspect-video rounded-lg overflow-hidden border border-neutral-200 bg-neutral-100 block shadow-xs cursor-pointer"
          >
            <img
              src={imgUrl}
              alt={`Foto Avaria ${i + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
              <Eye className="w-4 h-4" /> Ampliar Foto
            </div>
            <span className="absolute bottom-1 left-1.5 bg-black/70 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded">
              Foto #{i + 1}
            </span>
          </div>
        ))}
      </div>

      {activeIdx !== null && (
        <PhotoLightboxModal
          images={images}
          currentIndex={activeIdx}
          onClose={() => setActiveIdx(null)}
          onNavigate={(newIdx) => setActiveIdx(newIdx)}
        />
      )}
    </div>
  )
}
