import { useEffect, useState } from 'react'

const nf = new Intl.NumberFormat('es', { maximumFractionDigits: 2 })
export const fmt = (n: number) => nf.format(n)
export const short = (addr: string) => `${addr.slice(0, 4)}…${addr.slice(-4)}`

export function timeAgo(iso: string) {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return 'hace unos segundos'
  if (s < 3600) return `hace ${Math.round(s / 60)} min`
  if (s < 86400) return `hace ${Math.round(s / 3600)} h`
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

// Router mínimo por hash: funciona en cualquier hosting estático sin configuración.
export function useRoute() {
  const [hash, setHash] = useState(() => window.location.hash.slice(1))
  useEffect(() => {
    const on = () => {
      setHash(window.location.hash.slice(1))
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return hash.replace(/^\//, '')
}

export const go = (path: string) => {
  window.location.hash = `/${path}`
}
