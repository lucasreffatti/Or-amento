'use client'

import { useEffect } from 'react'

export function AutoPrint() {
 useEffect(() => {
 // Timeout pequeno para garantir que todas as fontes e imagens renderizem antes de abrir o diálogo
 const timer = setTimeout(() => {
 window.print()
 }, 500)
 
 return () => clearTimeout(timer)
 }, [])
 
 return null
}
