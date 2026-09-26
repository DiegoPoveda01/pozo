import { useEffect, type ReactNode } from 'react'

export function Spinner({ className = 'size-4' }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function Check({ className = 'size-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ExternalLink({ href, children, className = '' }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-1 font-medium text-brand-700 hover:underline ${className}`}>
      {children}
      <svg className="size-3.5" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M14 5h5v5M19 5l-8 8M10 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </a>
  )
}

export const btn = {
  primary:
    'inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-600 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50',
  secondary:
    'inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-3 font-semibold text-ink transition hover:border-stone-400 hover:bg-stone-50 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50',
  ghost:
    'inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-stone-600 transition hover:bg-stone-100 disabled:opacity-50',
}

export const input =
  'w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-ink outline-none transition placeholder:text-stone-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)] sm:p-6 ${className}`}>{children}</section>
}

export type StepState = 'pending' | 'active' | 'done' | 'error'

export function Steps({ steps }: { steps: { label: string; detail?: string; state: StepState }[] }) {
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => (
        <li key={i} className="flex gap-3">
          <span
            className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
              s.state === 'done'
                ? 'bg-brand-600 text-white'
                : s.state === 'active'
                  ? 'bg-brand-50 text-brand-700 ring-2 ring-brand-500'
                  : s.state === 'error'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-stone-100 text-stone-400'
            }`}
          >
            {s.state === 'done' ? <Check className="size-3.5" /> : s.state === 'active' ? <Spinner className="size-3.5" /> : s.state === 'error' ? '!' : i + 1}
          </span>
          <div className={s.state === 'pending' ? 'text-stone-400' : ''}>
            <p className="text-sm font-semibold">{s.label}</p>
            {s.detail && <p className="text-xs text-stone-500">{s.detail}</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-ink/40 backdrop-blur-sm sm:place-items-center sm:p-4" onClick={onClose}>
      <div
        className="w-full max-w-md animate-rise rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal
        aria-label={title}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100" aria-label="Cerrar">
            <svg className="size-5" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Avatar({ name, tone = 'brand' }: { name: string; tone?: 'brand' | 'amber' | 'sky' }) {
  const tones = { brand: 'bg-brand-100 text-brand-900', amber: 'bg-amber-100 text-amber-900', sky: 'bg-sky-100 text-sky-900' }
  return (
    <span className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold ${tones[tone]}`}>
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  )
}
