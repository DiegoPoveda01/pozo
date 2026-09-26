import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { fmt, short, timeAgo } from '../lib/format'
import { accountUrl, loadCampaign, loadLedger, txUrl, type Campaign, type LedgerEntry } from '../lib/stellar'
import { getKeys } from '../lib/store'
import DonateCard from './DonateCard'
import TreasuryCard from './TreasuryCard'
import { btn, Card, ExternalLink, Spinner } from './ui'

const POLL_MS = 5000

export default function CampaignPage({ address }: { address: string }) {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [ledger, setLedger] = useState<LedgerEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fresh, setFresh] = useState<Set<string>>(new Set())
  const known = useRef<Set<string> | null>(null)
  const keys = useMemo(() => getKeys(address), [address])

  const refresh = useCallback(async () => {
    try {
      const [c, l] = await Promise.all([loadCampaign(address), loadLedger(address)])
      // Resalta los movimientos que aparecen después de la primera carga.
      const ids = l.map((e) => e.id)
      if (known.current) {
        const added = ids.filter((id) => !known.current!.has(id))
        if (added.length) setFresh(new Set(added))
      }
      known.current = new Set(ids)
      setCampaign(c)
      setLedger(l)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    }
  }, [address])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, POLL_MS)
    return () => clearInterval(id)
  }, [refresh])

  const stats = useMemo(() => {
    const ins = ledger?.filter((e) => e.kind === 'in') ?? []
    const sum = (kind: LedgerEntry['kind']) => (ledger ?? []).filter((e) => e.kind === kind).reduce((a, e) => a + e.amount, 0)
    const raised = sum('in')
    const spent = sum('out')
    const refunded = sum('refund')
    return { raised, spent, refunded, available: raised - spent - refunded, donations: ins.length }
  }, [ledger])

  if (!campaign || !ledger) {
    return (
      <div className="mx-auto grid max-w-6xl place-items-center px-4 py-32 text-center">
        {error ? (
          <div className="max-w-md">
            <p className="text-xl font-bold">No pudimos cargar esta colecta</p>
            <p className="mt-2 text-stone-600">{error}</p>
            <p className="mt-1 text-sm text-stone-500">Si la colecta es antigua, puede que la testnet se haya reiniciado.</p>
            <div className="mt-6 flex justify-center gap-3">
              <button className={btn.secondary} onClick={refresh}>
                Reintentar
              </button>
              <a className={btn.primary} href="#/crear">
                Crear una nueva
              </a>
            </div>
          </div>
        ) : (
          <p className="flex items-center gap-3 text-stone-500">
            <Spinner className="size-5" /> Leyendo la colecta desde Stellar…
          </p>
        )}
      </div>
    )
  }

  const pct = campaign.goal ? Math.min(100, (stats.raised / campaign.goal) * 100) : 0

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {error && (
        <p className="mb-4 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-900">
          Sin conexión con Stellar por el momento; mostrando los últimos datos leídos.
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:grid-rows-[auto_1fr]">
        <Card className="lg:col-start-1 lg:row-start-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-500 opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-brand-500" />
              </span>
              En vivo desde Stellar
            </span>
            <span className="font-mono text-xs text-stone-400">{short(address)}</span>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{campaign.title}</h1>
          {campaign.description && <p className="mt-2 text-lg text-stone-600">{campaign.description}</p>}

          <div className="mt-6 h-3 overflow-hidden rounded-full bg-stone-100">
            <div className="h-full rounded-full bg-brand-600 transition-[width] duration-700" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-sm text-stone-500">
            <span className="num text-base font-bold text-ink">{fmt(stats.raised)} XLM</span> recaudados de {fmt(campaign.goal)} · {stats.donations} aportes
          </p>

          <dl className="mt-6 grid grid-cols-3 gap-3">
            <Stat label="Recaudado" value={stats.raised} />
            <Stat label="Gastado" value={stats.spent} tone="text-rose-600" />
            <Stat label="Disponible" value={stats.available} tone="text-brand-700" />
          </dl>
          {stats.refunded > 0 && (
            <p className="mt-3 text-sm text-stone-600">
              <span className="num font-bold text-sky-700">{fmt(stats.refunded)} XLM</span> devueltos a los aportantes en proporción a lo que pusieron.
            </p>
          )}
        </Card>

        <aside className="space-y-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          <DonateCard treasury={address} onDonated={refresh} />
          <TreasuryCard campaign={campaign} keys={keys} available={stats.available} donations={ledger.filter((e) => e.kind === 'in')} onChanged={refresh} />
          <ShareCard address={address} report={report(campaign, stats, ledger)} />
        </aside>

        <div className="lg:col-start-1 lg:row-start-2 lg:self-start">
          <Ledger entries={ledger} campaign={campaign} fresh={fresh} />
        </div>
      </div>
    </div>
  )
}

// Mensaje de rendición listo para pegar en el grupo de WhatsApp de la colecta.
function report(c: Campaign, s: { raised: number; spent: number; refunded: number; available: number; donations: number }, ledger: LedgerEntry[]) {
  const last = ledger.find((e) => e.kind === 'out')
  const lines = [
    `*${c.title}* · rendición de cuentas`,
    `Recaudado: ${fmt(s.raised)} XLM (${s.donations} aportes)`,
    `Gastado: ${fmt(s.spent)} XLM`,
    s.refunded > 0 ? `Devuelto a aportantes: ${fmt(s.refunded)} XLM` : '',
    `Disponible: ${fmt(s.available)} XLM`,
    last ? `Último gasto: ${fmt(last.amount)} XLM → ${c.vendors[last.counterparty] ?? short(last.counterparty)} (${last.signatures} firmas)` : '',
    `Ningún pago sale sin ${c.thresholds.med} de ${c.signers.length} firmas. Cada movimiento se verifica en Stellar:`,
  ]
  return lines.filter(Boolean).join('\n')
}

function Stat({ label, value, tone = 'text-ink' }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-xl bg-paper p-3 sm:p-4">
      <dt className="text-xs font-semibold text-stone-500 sm:text-sm">{label}</dt>
      <dd className={`num mt-1 text-lg font-extrabold sm:text-2xl ${tone}`}>
        {fmt(value)} <span className="text-xs font-semibold text-stone-400">XLM</span>
      </dd>
    </div>
  )
}

function Ledger({ entries, campaign, fresh }: { entries: LedgerEntry[]; campaign: Campaign; fresh: Set<string> }) {
  // Una devolución son varios pagos en la misma transacción: se muestran como una sola fila.
  const rows: (LedgerEntry & { count: number })[] = []
  for (const e of entries) {
    const last = rows[rows.length - 1]
    if (e.kind === 'refund' && last?.kind === 'refund' && last.hash === e.hash) {
      last.amount += e.amount
      last.count += 1
    } else rows.push({ ...e, count: 1 })
  }
  return (
    <Card className="p-0 sm:p-0">
      <div className="flex items-end justify-between gap-4 border-b border-stone-100 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-bold">Libro de cuentas público</h2>
          <p className="text-sm text-stone-500">Cada fila es una transacción confirmada en Stellar. Nadie puede editarla ni borrarla.</p>
        </div>
      </div>
      {entries.length === 0 ? (
        <p className="p-8 text-center text-stone-500">Aún no hay movimientos. ¡Sé el primero en aportar!</p>
      ) : (
        <ul className="divide-y divide-stone-100">
          {rows.map((e) => {
            const vendor = campaign.vendors[e.counterparty]
            const title =
              e.kind === 'created'
                ? 'Colecta creada en Stellar'
                : e.kind === 'in'
                  ? e.memo || 'Aporte anónimo'
                  : e.kind === 'refund'
                    ? `Devolución a ${e.count} ${e.count === 1 ? 'aporte' : 'aportes'}`
                    : (vendor ?? short(e.counterparty))
            const sub =
              e.kind === 'created'
                ? `Reserva técnica de la red (${fmt(e.amount)} XLM), no cuenta como aporte`
                : e.kind === 'in'
                  ? `Aporte desde ${short(e.counterparty)}`
                  : e.kind === 'refund'
                    ? 'Lo que sobró, en proporción · una sola transacción'
                    : e.memo || 'Pago'
            return (
              <li key={e.id} className={`flex items-center gap-3 px-5 py-4 sm:px-6 ${fresh.has(e.id) ? 'animate-flash' : ''}`}>
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-full ${
                    e.kind === 'in'
                      ? 'bg-brand-50 text-brand-700'
                      : e.kind === 'out'
                        ? 'bg-rose-50 text-rose-600'
                        : e.kind === 'refund'
                          ? 'bg-sky-50 text-sky-700'
                          : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {e.kind === 'in' ? <Arrow down /> : e.kind === 'created' ? <Spark /> : <Arrow />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{title}</p>
                  <p className="flex flex-wrap items-center gap-x-2 text-xs text-stone-500">
                    <span className="truncate">{sub}</span>
                    {(e.kind === 'out' || e.kind === 'refund') && (
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 font-semibold text-brand-700">✓ {e.signatures} firmas</span>
                    )}
                    <span>· {timeAgo(e.createdAt)}</span>
                  </p>
                </div>
                <div className="text-right">
                  {e.kind !== 'created' && (
                    <p className={`num font-bold ${e.kind === 'in' ? 'text-brand-700' : e.kind === 'refund' ? 'text-sky-700' : 'text-rose-600'}`}>
                      {e.kind === 'in' ? '+' : '−'}
                      {fmt(e.amount)}
                    </p>
                  )}
                  <ExternalLink href={txUrl(e.hash)} className="text-xs">
                    Ver tx
                  </ExternalLink>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

function ShareCard({ address, report }: { address: string; report: string }) {
  const url = `${window.location.origin}${window.location.pathname}#/c/${address}`
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copia este enlace', url)
    }
  }
  return (
    <Card>
      <h2 className="font-bold">Compartir la colecta</h2>
      <p className="text-sm text-stone-500">Cualquiera con este enlace ve los mismos datos, leídos directamente de Stellar.</p>
      <div className="mt-4 flex items-center gap-4">
        <div className="rounded-xl border border-stone-200 bg-white p-2">
          <QRCodeSVG value={url} size={104} fgColor="#16181d" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <button className={`${btn.secondary} py-2 text-sm`} onClick={copy}>
            {copied ? '¡Enlace copiado!' : 'Copiar enlace'}
          </button>
          <ExternalLink href={accountUrl(address)} className="text-sm">
            Auditar en Stellar Expert
          </ExternalLink>
        </div>
      </div>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${report}\n${url}`)}`}
        target="_blank"
        rel="noreferrer"
        className="mt-4 flex w-full items-center justify-center rounded-xl bg-[#1f9d55] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#188a49]"
      >
        Enviar rendición por WhatsApp
      </a>
      <p className="mt-2 text-xs text-stone-500">Arma el resumen de la colecta con el enlace verificable; tú eliges el grupo antes de enviarlo.</p>
    </Card>
  )
}

function Arrow({ down }: { down?: boolean }) {
  return (
    <svg className={`size-5 ${down ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 19V5M6 11l6-6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Spark() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
