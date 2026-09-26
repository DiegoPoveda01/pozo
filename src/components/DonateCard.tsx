import { useEffect, useState, type FormEvent } from 'react'
import { Keypair } from '@stellar/stellar-sdk'
import { fmt, short } from '../lib/format'
import { byteLength, fundWithFriendbot, MEMO_MAX_BYTES, sendPayment, server, txUrl } from '../lib/stellar'
import { getDonorSecret, saveDonorSecret } from '../lib/store'
import { btn, Card, Check, ExternalLink, input, Steps, type StepState } from './ui'

const AMOUNTS = [10, 25, 50, 100]
const TRADITIONAL_FEE = 0.1 // ~10% (plataforma + pasarela) usado como referencia en el pitch

// Billetera de prueba del visitante: se crea y se fondea con Friendbot una sola vez.
let donorReady: Promise<Keypair> | null = null
function ensureDonor() {
  if (!donorReady) {
    donorReady = (async () => {
      let secret = getDonorSecret()
      if (!secret) {
        secret = Keypair.random().secret()
        saveDonorSecret(secret)
      }
      const kp = Keypair.fromSecret(secret)
      const exists = await server.loadAccount(kp.publicKey()).then(
        () => true,
        () => false,
      )
      if (!exists) await fundWithFriendbot(kp.publicKey())
      return kp
    })()
    donorReady.catch(() => (donorReady = null))
  }
  return donorReady
}

type Phase =
  | { kind: 'form' }
  | { kind: 'running'; step: number }
  | { kind: 'error'; step: number; message: string }
  | { kind: 'done'; hash: string; ledger: number; seconds: number; amount: number }

export default function DonateCard({ treasury, onDonated }: { treasury: string; onDonated: () => void }) {
  const [amount, setAmount] = useState('50')
  const [memo, setMemo] = useState('')
  const [phase, setPhase] = useState<Phase>({ kind: 'form' })
  const [wallet, setWallet] = useState<{ address: string; balance: number } | null>(null)

  const refreshWallet = async () => {
    try {
      const kp = await ensureDonor()
      const acc = await server.loadAccount(kp.publicKey())
      setWallet({ address: kp.publicKey(), balance: Number(acc.balances.find((b) => b.asset_type === 'native')?.balance ?? 0) })
    } catch {
      // Se reintenta al aportar, donde el error sí se muestra.
    }
  }

  useEffect(() => {
    refreshWallet()
  }, [])

  const memoBytes = byteLength(memo.trim())
  const value = Number(amount)
  const invalid = !(value > 0) || memoBytes > MEMO_MAX_BYTES || (wallet !== null && value > wallet.balance - 2)

  async function donate(e: FormEvent) {
    e.preventDefault()
    if (invalid) return
    let step = 0
    try {
      setPhase({ kind: 'running', step: 0 })
      const kp = await ensureDonor()
      step = 1
      setPhase({ kind: 'running', step: 1 })
      const t0 = performance.now()
      const res = await sendPayment(kp.secret(), treasury, String(value), memo)
      setPhase({ kind: 'done', hash: res.hash, ledger: res.ledger, seconds: (performance.now() - t0) / 1000, amount: value })
      setMemo('')
      onDonated()
      refreshWallet()
    } catch (err) {
      setPhase({ kind: 'error', step, message: err instanceof Error ? err.message : 'Error desconocido' })
    }
  }

  if (phase.kind === 'done') {
    return (
      <Card className="animate-rise">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-full bg-brand-600 text-white">
            <Check className="size-6" />
          </span>
          <div>
            <p className="text-lg font-bold">¡Aporte confirmado!</p>
            <p className="text-sm text-stone-500">
              En <strong className="num text-ink">{phase.seconds.toFixed(1)} s</strong> · ledger <span className="num">#{phase.ledger}</span>
            </p>
          </div>
        </div>
        <div className="mt-5 space-y-2 rounded-xl bg-paper p-4 text-sm">
          <Row label="Llegó a la colecta" value={`${fmt(phase.amount)} XLM`} strong />
          <Row label="Comisión de la red Stellar" value="0,00001 XLM" />
          <Row label="Con una comisión de ~10% se perderían" value={`${fmt(phase.amount * TRADITIONAL_FEE)} XLM`} muted />
        </div>
        <p className="mt-4 text-sm text-stone-600">
          Tu billetera firmó un pago directo a la cuenta de la colecta. Ya aparece en el libro de cuentas y nadie puede modificarlo.
        </p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <ExternalLink href={txUrl(phase.hash)} className="text-sm">
            Ver en Stellar Expert
          </ExternalLink>
          <button className={`${btn.secondary} py-2 text-sm`} onClick={() => setPhase({ kind: 'form' })}>
            Aportar de nuevo
          </button>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <h2 className="text-lg font-bold">Aportar a la colecta</h2>
      <p className="text-sm text-stone-500">El dinero va directo a la cuenta de la colecta, no a una persona.</p>

      {phase.kind === 'form' ? (
        <form onSubmit={donate} className="mt-5 space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {AMOUNTS.map((a) => (
              <button
                type="button"
                key={a}
                onClick={() => setAmount(String(a))}
                className={`num rounded-xl border py-2.5 font-bold transition ${
                  amount === String(a) ? 'border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-100' : 'border-stone-200 hover:border-stone-400'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Monto (XLM)</span>
            <input className={`${input} num`} type="number" min="1" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 flex justify-between text-sm font-semibold">
              Tu nombre o un mensaje
              <span className={`num font-medium ${memoBytes > MEMO_MAX_BYTES ? 'text-red-600' : 'text-stone-400'}`}>
                {memoBytes}/{MEMO_MAX_BYTES}
              </span>
            </span>
            <input className={input} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Ej: Familia Pérez ¡fuerza!" />
            <span className="mt-1 block text-xs text-stone-500">Queda público en la blockchain como memo de la transacción.</span>
          </label>
          <button className={`${btn.primary} w-full py-3.5 text-base`} disabled={invalid}>
            Aportar {value > 0 ? fmt(value) : ''} XLM
          </button>
          <p className="text-center text-xs text-stone-500">
            {wallet ? (
              <>
                Billetera de prueba <span className="font-mono">{short(wallet.address)}</span> · <span className="num">{fmt(wallet.balance)}</span> XLM de
                testnet
              </>
            ) : (
              'Preparando tu billetera de prueba en testnet…'
            )}
          </p>
        </form>
      ) : (
        <div className="mt-5">
          <Steps
            steps={[
              { label: 'Preparando tu billetera de prueba', detail: 'Friendbot entrega XLM de testnet (solo la primera vez).' },
              {
                label: 'Firmando y enviando el pago a Stellar',
                detail: `${fmt(value)} XLM → cuenta de la colecta ${short(treasury)}. La red confirma en ~5 s.`,
              },
            ].map((s, i) => ({
              ...s,
              state: (i < phase.step ? 'done' : i === phase.step ? (phase.kind === 'error' ? 'error' : 'active') : 'pending') as StepState,
            }))}
          />
          {phase.kind === 'error' && (
            <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">
              <p className="font-semibold">{phase.message}</p>
              <button className={`${btn.secondary} mt-3 py-2 text-sm`} onClick={() => setPhase({ kind: 'form' })}>
                Intentar de nuevo
              </button>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function Row({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-stone-500">{label}</span>
      <span className={`num ${strong ? 'font-bold text-brand-700' : muted ? 'text-stone-400 line-through' : 'font-semibold'}`}>{value}</span>
    </div>
  )
}
