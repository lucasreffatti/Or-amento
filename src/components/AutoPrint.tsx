'use client'

import { useEffect } from 'react'

export function AutoPrint() {
  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      window.print()
    })
    return () => cancelAnimationFrame(handle)
  }, [])
  
  return null
}
