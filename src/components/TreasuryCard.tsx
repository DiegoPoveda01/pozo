import { useState, type FormEvent } from 'react'
import { StrKey } from '@stellar/stellar-sdk'
import { fmt, short } from '../lib/format'
import {
  addSignature,
  buildPayout,
  byteLength,
  MAX_OPS,
  MEMO_MAX_BYTES,
  REFUND_MEMO,
  submitXdr,
  txUrl,
  StellarError,
  type Campaign,
  type CampaignKeys,
  type LedgerEntry,
} from '../lib/stellar'
import { getProposal, saveProposal, type Proposal } from '../lib/store'
import { Avatar, btn, Card, Check, ExternalLink, input, Modal, Spinner } from './ui'

type Result = { kind: 'ok'; hash: string; amount: string; to: string } | { kind: 'rejected'; message: string; code?: string } | null

export default function TreasuryCard({
  campaign,
  keys,
  available,
  donations,
  onChanged,
}: {
  campaign: Campaign
  keys: CampaignKeys | null
  available: number
  donations: LedgerEntry[]
  onChanged: () => void
}) {
  const [proposal, setProposal] = useState<Proposal | null>(() => getProposal(campaign.address))
  const [modal, setModal] = useState<'expense' | 'refund' | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [result, setResult] = useState<Result>(null)

  const required = campaign.thresholds.med
  const organizer = keys?.signers[0]

  const update = (p: Proposal | null) => {
    saveProposal(campaign.address, p)
    setProposal(p)
  }

  async function approve(signer: CampaignKeys['signers'][number]) {
    if (!proposal) return
    setBusy(signer.publicKey)
    setResult(null)
    try {
      const xdr = addSignature(proposal.xdr, signer.secret)
      const res = await submitXdr(xdr)
      setResult({ kind: 'ok', hash: res.hash, amount: proposal.amount, to: proposal.destinationName })
      update(null)
      onChanged()
    } catch (e) {
      const err = e as StellarError
      if (err.code === 'tx_bad_seq') update(null)
      setResult({ kind: 'rejected', message: err.message, code: err.code })
    } finally {
      setBusy(null)
    }
  }

  // Demostración: se envía a la red la transacción con UNA sola firma. Stellar la rechaza.
  async function trySingleSignature() {
    if (!proposal) return
    setBusy('single')
    setResult(null)
    try {
      const res = await submitXdr(proposal.xdr)
      setResult({ kind: 'ok', hash: res.hash, amount: proposal.amount, to: proposal.destinationName })
      update(null)
      onChanged()
    } catch (e) {
      const err = e as StellarError
      if (err.code === 'tx_bad_seq') update(null)
      setResult({ kind: 'rejected', message: err.message, code: err.code })
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Tesorería protegida</h2>
          <p className="text-sm text-stone-500">Reglas leídas en vivo desde la cuenta en Stellar.</p>
        </div>
        <span className="num shrink-0 rounded-full bg-ink px-3 py-1 text-sm font-bold text-white">
          {required} de {campaign.signers.length}
        </span>
      </div>

      <ul className="mt-4 space-y-2 rounded-xl bg-paper p-4 text-sm">
        <li className="flex gap-2">
          <Check className="mt-0.5 size-4 shrink-0 text-brand-600" />
          <span>
            Mover dinero requiere <strong>{required} firmas</strong> de {campaign.signers.length} firmantes.
          </span>
        </li>
        {campaign.masterWeight === 0 && (
          <li className="flex gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-brand-600" />
            <span>
              <strong>Llave maestra desactivada:</strong> nadie puede retirar fondos por su cuenta.
            </span>
          </li>
        )}
      </ul>

      <ul className="mt-4 space-y-3">
        {campaign.signers.map((s, i) => (
          <li key={s.publicKey} className="flex items-center gap-3">
            <Avatar name={s.name} tone={i === 0 ? 'amber' : i === 1 ? 'brand' : 'sky'} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {s.name} <span className="font-normal text-stone-500">· {s.role}</span>
              </p>
              <p className="font-mono text-xs text-stone-400">
                {short(s.publicKey)} · peso {s.weight}
              </p>
            </div>
          </li>
        ))}
      </ul>
      {keys && <p className="mt-3 text-xs text-stone-500">Demo: las 3 llaves están en este navegador. En producción cada firmante usa su propia billetera.</p>}

      <div className="mt-5 border-t border-stone-100 pt-5">
        {!keys || !organizer ? (
          <p className="text-sm text-stone-500">
            Solo los firmantes pueden proponer y aprobar gastos. Tú puedes verificar cada movimiento en el libro de cuentas.
          </p>
        ) : proposal ? (
          <div className="rounded-xl border-2 border-amber-300 bg-amber-50/60 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
              {proposal.kind === 'refund' ? 'Devolución pendiente de aprobación' : 'Gasto pendiente de aprobación'}
            </p>
            <p className="mt-1 font-bold">{proposal.concept}</p>
            <p className="text-sm text-stone-600">
              <span className="num font-bold text-ink">{fmt(Number(proposal.amount))} XLM</span> → {proposal.destinationName}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex gap-1">
                {Array.from({ length: required }).map((_, i) => (
                  <span key={i} className={`h-2 w-8 rounded-full ${i < proposal.signedBy.length ? 'bg-brand-600' : 'bg-stone-200'}`} />
                ))}
              </div>
              <span className="num text-sm font-semibold">
                {proposal.signedBy.length}/{required} firmas
              </span>
              <span className="text-xs text-stone-500">· firmó {organizer.name}</span>
            </div>

            <div className="mt-4 space-y-2">
              {keys.signers
                .filter((s) => !proposal.signedBy.includes(s.publicKey))
                .map((s) => (
                  <button key={s.publicKey} className={`${btn.primary} w-full py-2.5 text-sm`} disabled={busy !== null} onClick={() => approve(s)}>
                    {busy === s.publicKey ? <Spinner /> : null} Aprobar y pagar como {s.name}
                  </button>
                ))}
              <button className={`${btn.secondary} w-full py-2.5 text-sm`} disabled={busy !== null} onClick={trySingleSignature}>
                {busy === 'single' ? <Spinner /> : null} Intentar pagar solo con la firma de {organizer.name}
              </button>
              <button className={`${btn.ghost} w-full`} disabled={busy !== null} onClick={() => update(null)}>
                Descartar propuesta
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              className={`${btn.primary} w-full`}
              onClick={() => {
                setResult(null)
                setModal('expense')
              }}
            >
              Proponer un gasto
            </button>
            <button
              className={`${btn.secondary} w-full`}
              disabled={/* el redondeo hacia abajo deja stroops sueltos */ !(available >= 0.01) || donations.length === 0}
              onClick={() => {
                setResult(null)
                setModal('refund')
              }}
            >
              Devolver lo que sobra a los aportantes
            </button>
          </div>
        )}

        {result?.kind === 'rejected' && (
          <div className="mt-4 animate-rise rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            <p className="font-bold">Stellar rechazó la transacción{result.code ? ` (${result.code})` : ''}</p>
            <p className="mt-1">{result.message}</p>
            {result.code === 'tx_bad_auth' && <p className="mt-2 text-red-800/80">La regla la aplica la red, no nuestra app: no hay forma de saltarla.</p>}
          </div>
        )}
        {result?.kind === 'ok' && (
          <div className="mt-4 animate-rise rounded-xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-900">
            <p className="font-bold">Pago aprobado con 2 firmas y enviado</p>
            <p className="mt-1">
              {fmt(Number(result.amount))} XLM → {result.to}. Ya figura en el libro de cuentas.
            </p>
            <ExternalLink href={txUrl(result.hash)} className="mt-2 text-sm">
              Ver en Stellar Expert
            </ExternalLink>
          </div>
        )}
      </div>

      {keys && organizer && modal === 'expense' && (
        <ExpenseModal
          open
          onClose={() => setModal(null)}
          campaign={campaign}
          available={available}
          proposer={organizer}
          onCreated={(p) => {
            update(p)
            setModal(null)
          }}
        />
      )}
      {keys && organizer && modal === 'refund' && (
        <RefundModal
          onClose={() => setModal(null)}
          campaign={campaign}
          available={available}
          donations={donations}
          proposer={organizer}
          onCreated={(p) => {
            update(p)
            setModal(null)
          }}
        />
      )}
    </Card>
  )
}

function ExpenseModal({
  open,
  onClose,
  campaign,
  available,
  proposer,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  campaign: Campaign
  available: number
  proposer: CampaignKeys['signers'][number]
  onCreated: (p: Proposal) => void
}) {
  const vendorList = Object.entries(campaign.vendors)
  const [vendor, setVendor] = useState(vendorList[0]?.[0] ?? 'other')
  const [other, setOther] = useState('')
  const [amount, setAmount] = useState(String(Math.min(120, Math.floor(available)) || ''))
  const [concept, setConcept] = useState('Chapas y tornillos techo')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const destination = vendor === 'other' ? other.trim() : vendor
  const value = Number(amount)
  const conceptBytes = byteLength(concept.trim())
  const problems = [
    !StrKey.isValidEd25519PublicKey(destination) && 'Dirección de destino inválida',
    !(value > 0) && 'Ingresa un monto',
    value > available && `Solo hay ${fmt(available)} XLM disponibles`,
    (conceptBytes === 0 || conceptBytes > MEMO_MAX_BYTES) && `El concepto debe tener entre 1 y ${MEMO_MAX_BYTES} bytes`,
  ].filter(Boolean) as string[]

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (problems.length) return
    setBusy(true)
    setError(null)
    try {
      const xdr = await buildPayout(campaign.address, [{ destination, amount: String(value) }], concept, proposer.secret)
      onCreated({
        kind: 'expense',
        xdr,
        amount: String(value),
        destination,
        destinationName: campaign.vendors[destination] ?? short(destination),
        concept: concept.trim(),
        signedBy: [proposer.publicKey],
        createdAt: Date.now(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Proponer un gasto">
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-stone-600">
          <strong>{proposer.name}</strong> firma la propuesta (1 de 2). El pago solo sale cuando otro firmante la aprueba.
        </p>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">Pagar a</span>
          <select className={input} value={vendor} onChange={(e) => setVendor(e.target.value)}>
            {vendorList.map(([pk, name]) => (
              <option key={pk} value={pk}>
                {name} ({short(pk)})
              </option>
            ))}
            <option value="other">Otra cuenta de Stellar…</option>
          </select>
        </label>
        {vendor === 'other' && (
          <input
            className={`${input} font-mono text-sm`}
            value={other}
            onChange={(e) => setOther(e.target.value)}
            placeholder="G…"
            aria-label="Dirección de destino"
          />
        )}
        <label className="block">
          <span className="mb-1.5 flex justify-between text-sm font-semibold">
            Monto (XLM) <span className="num font-medium text-stone-400">Disponible: {fmt(available)}</span>
          </span>
          <input className={`${input} num`} type="number" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 flex justify-between text-sm font-semibold">
            Concepto (público)
            <span className={`num font-medium ${conceptBytes > MEMO_MAX_BYTES ? 'text-red-600' : 'text-stone-400'}`}>
              {conceptBytes}/{MEMO_MAX_BYTES}
            </span>
          </span>
          <input className={input} value={concept} onChange={(e) => setConcept(e.target.value)} />
        </label>
        {problems.length > 0 && <p className="text-sm text-amber-700">{problems[0]}</p>}
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <button className={`${btn.primary} w-full`} disabled={busy || problems.length > 0}>
          {busy ? <Spinner /> : null} Firmar propuesta como {proposer.name}
        </button>
      </form>
    </Modal>
  )
}

// Devuelve lo que queda en la colecta: a cada aporte le corresponde la misma proporción que puso.
// Todos los pagos van en UNA transacción atómica: o reciben todos, o nadie.
function RefundModal({
  onClose,
  campaign,
  available,
  donations,
  proposer,
  onCreated,
}: {
  onClose: () => void
  campaign: Campaign
  available: number
  donations: LedgerEntry[]
  proposer: CampaignKeys['signers'][number]
  onCreated: (p: Proposal) => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const raised = donations.reduce((a, d) => a + d.amount, 0)
  const refunds = donations
    .map((d) => ({
      id: d.id,
      name: d.memo || short(d.counterparty),
      destination: d.counterparty,
      gave: d.amount,
      amount: Math.floor(((available * d.amount) / raised) * 1e7) / 1e7,
    }))
    .filter((r) => r.amount > 0)
  const total = refunds.reduce((a, r) => a + r.amount, 0)
  const tooMany = refunds.length > MAX_OPS

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      const payments = refunds.map((r) => ({ destination: r.destination, amount: r.amount.toFixed(7) }))
      const xdr = await buildPayout(campaign.address, payments, REFUND_MEMO, proposer.secret)
      onCreated({
        kind: 'refund',
        xdr,
        amount: String(total),
        destination: '',
        destinationName: `${refunds.length} aportes, en proporción`,
        concept: REFUND_MEMO,
        signedBy: [proposer.publicKey],
        createdAt: Date.now(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Devolver lo que sobra">
      <p className="text-sm text-stone-600">
        Quedan <strong className="num">{fmt(available)} XLM</strong>. Cada aporte recibe de vuelta la misma proporción que puso, en{' '}
        <strong>una sola transacción</strong>: o reciben todos, o nadie.
      </p>
      <div className="mt-4 max-h-60 overflow-y-auto rounded-xl border border-stone-200">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-stone-50 text-left text-xs text-stone-500">
            <tr>
              <th className="px-3 py-2 font-semibold">Aporte</th>
              <th className="px-3 py-2 text-right font-semibold">Puso</th>
              <th className="px-3 py-2 text-right font-semibold">Recibe</th>
            </tr>
          </thead>
          <tbody>
            {refunds.map((r) => (
              <tr key={r.id} className="border-t border-stone-100">
                <td className="max-w-40 truncate px-3 py-2 font-medium">{r.name}</td>
                <td className="num px-3 py-2 text-right text-stone-500">{fmt(r.gave)}</td>
                <td className="num px-3 py-2 text-right font-bold text-sky-700">{fmt(r.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-stone-500">
        {refunds.length} pagos por una comisión de red total de {(refunds.length / 1e5).toLocaleString('es', { maximumFractionDigits: 5 })} XLM. {proposer.name}{' '}
        firma la propuesta (1 de 2); sale cuando otro firmante la aprueba.
      </p>
      {tooMany && <p className="mt-3 text-sm text-amber-700">Esta versión devuelve hasta {MAX_OPS} aportes por transacción.</p>}
      {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <button className={`${btn.primary} mt-4 w-full`} disabled={busy || tooMany || refunds.length === 0} onClick={submit}>
        {busy ? <Spinner /> : null} Firmar devolución como {proposer.name}
      </button>
    </Modal>
  )
}
