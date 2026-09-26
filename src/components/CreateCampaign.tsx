import { useState, type FormEvent, type ReactNode } from 'react'
import { go } from '../lib/format'
import { byteLength, createCampaign, sendPayment, txUrl, type SignerInput } from '../lib/stellar'
import { addMyCampaign, saveKeys } from '../lib/store'
import { btn, Card, ExternalLink, input, Spinner, Steps, type StepState } from './ui'

// Aportes iniciales reales (se envían desde la cuenta que financió la creación) para que la colecta no arranque vacía.
const SEED_DONATIONS = [
  { memo: 'Doña Rosa', amount: '150' },
  { memo: 'Club Deportivo Sur', amount: '300' },
  { memo: 'Vecinos del bloque 4', amount: '80' },
]

type Phase =
  { kind: 'form' } | { kind: 'running'; step: number } | { kind: 'error'; step: number; message: string } | { kind: 'done'; address: string; hash: string }

export default function CreateCampaign() {
  const [title, setTitle] = useState('Techo nuevo para el comedor Los Aromos')
  const [description, setDescription] = useState('Cambiamos las chapas antes de las lluvias. Almuerzan 60 chicos.')
  const [goal, setGoal] = useState('1500')
  const [signers, setSigners] = useState<[SignerInput, SignerInput, SignerInput]>([
    { name: 'Marta', role: 'Organizadora' },
    { name: 'Ana', role: 'Tesorera' },
    { name: 'Luis', role: 'Tesorero' },
  ])
  const [vendors, setVendors] = useState(['Ferretería El Tornillo', 'Fletes Rápido Sur'])
  const [seed, setSeed] = useState(true)
  const [phase, setPhase] = useState<Phase>({ kind: 'form' })

  const tooLong = (s: string) => byteLength(s) > 64
  const invalid =
    !title.trim() ||
    tooLong(title) ||
    tooLong(description) ||
    !(Number(goal) > 0) ||
    signers.some((s) => !s.name.trim() || tooLong(`${s.name}|${s.role}`)) ||
    vendors.some((v) => !v.trim() || tooLong(v))

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (invalid) return
    let step = 0
    const setStep = (i: number) => {
      step = i
      setPhase({ kind: 'running', step: i })
    }
    try {
      const { keys, funderSecret, hash } = await createCampaign(
        { title: title.trim(), description: description.trim(), goal: Number(goal), signers, vendors: vendors.map((v) => v.trim()) },
        setStep,
      )
      saveKeys(keys)
      addMyCampaign({ address: keys.treasury, title: title.trim() })
      if (seed) {
        setStep(2)
        for (const d of SEED_DONATIONS) await sendPayment(funderSecret, keys.treasury, d.amount, d.memo)
      }
      setPhase({ kind: 'done', address: keys.treasury, hash })
    } catch (err) {
      setPhase({ kind: 'error', step, message: err instanceof Error ? err.message : 'Error desconocido' })
    }
  }

  if (phase.kind !== 'form') {
    const labels = [
      { label: 'Pidiendo XLM de prueba a Friendbot', detail: 'Una cuenta temporal recibe fondos de testnet para pagar la creación.' },
      { label: 'Creando la cuenta de la colecta', detail: '1 transacción: cuenta + 3 firmantes + umbral 2 de 3 + llave maestra desactivada + metadatos.' },
      ...(seed ? [{ label: 'Registrando aportes de ejemplo', detail: '3 pagos reales a la colecta, cada uno con su mensaje público.' }] : []),
    ]
    const current = phase.kind === 'done' ? labels.length : phase.step
    const steps = labels.map((l, i) => ({
      ...l,
      state: (i < current ? 'done' : i === current ? (phase.kind === 'error' ? 'error' : 'active') : 'pending') as StepState,
    }))
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Card>
          <h1 className="text-2xl font-bold tracking-tight">
            {phase.kind === 'done' ? '¡Tu colecta ya existe en Stellar!' : phase.kind === 'error' ? 'Algo salió mal' : 'Creando tu colecta en Stellar…'}
          </h1>
          <p className="mt-1 text-stone-500">{title}</p>
          <div className="mt-6">
            <Steps steps={steps} />
          </div>
          {phase.kind === 'error' && (
            <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-800">
              <p className="font-semibold">{phase.message}</p>
              <button className={`${btn.secondary} mt-3 py-2 text-sm`} onClick={() => setPhase({ kind: 'form' })}>
                Volver e intentar de nuevo
              </button>
            </div>
          )}
          {phase.kind === 'done' && (
            <div className="mt-6 space-y-3">
              <ExternalLink href={txUrl(phase.hash)} className="text-sm">
                Ver la transacción de creación en Stellar Expert
              </ExternalLink>
              <button className={`${btn.primary} w-full`} onClick={() => go(`c/${phase.address}`)}>
                Ir a la colecta
              </button>
            </div>
          )}
          {phase.kind === 'running' && (
            <p className="mt-6 flex items-center gap-2 text-sm text-stone-500">
              <Spinner /> Esto toma unos 20 segundos.
            </p>
          )}
        </Card>
      </div>
    )
  }

  const setSigner = (i: number, patch: Partial<SignerInput>) =>
    setSigners((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)) as [SignerInput, SignerInput, SignerInput])

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1.4fr_1fr]">
      <form onSubmit={submit} className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Crear una colecta</h1>
          <p className="mt-1 text-stone-600">Todo lo que completes aquí se publica en la cuenta de Stellar de la colecta.</p>
        </div>

        <Card className="space-y-4">
          <Field label="¿Para qué juntan dinero?" error={tooLong(title) ? 'Máximo 64 bytes' : undefined}>
            <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Field>
          <Field label="Descripción corta" error={tooLong(description) ? 'Máximo 64 bytes' : undefined}>
            <input className={input} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Field label="Meta (XLM)">
            <input className={`${input} num`} type="number" min="1" value={goal} onChange={(e) => setGoal(e.target.value)} required />
          </Field>
        </Card>

        <Card className="space-y-4">
          <div>
            <h2 className="font-bold">Firmantes</h2>
            <p className="text-sm text-stone-500">Para mover dinero se necesitan 2 de estas 3 personas.</p>
          </div>
          {signers.map((s, i) => (
            <div key={i} className="grid grid-cols-2 gap-3">
              <input
                className={input}
                value={s.name}
                onChange={(e) => setSigner(i, { name: e.target.value })}
                placeholder="Nombre"
                required
                aria-label={`Nombre firmante ${i + 1}`}
              />
              <input
                className={input}
                value={s.role}
                onChange={(e) => setSigner(i, { role: e.target.value })}
                placeholder="Rol"
                aria-label={`Rol firmante ${i + 1}`}
              />
            </div>
          ))}
        </Card>

        <Card className="space-y-4">
          <div>
            <h2 className="font-bold">Proveedores de ejemplo</h2>
            <p className="text-sm text-stone-500">Se crean como cuentas reales en testnet para poder pagarles gastos durante la demo.</p>
          </div>
          {vendors.map((v, i) => (
            <input
              key={i}
              className={input}
              value={v}
              onChange={(e) => setVendors((p) => p.map((x, j) => (j === i ? e.target.value : x)))}
              required
              aria-label={`Proveedor ${i + 1}`}
            />
          ))}
          <label className="flex items-start gap-3 rounded-xl bg-paper p-3 text-sm">
            <input type="checkbox" className="mt-0.5 size-4 accent-brand-700" checked={seed} onChange={(e) => setSeed(e.target.checked)} />
            <span>
              <strong>Agregar 3 aportes de ejemplo</strong>
              <span className="block text-stone-500">Pagos reales en testnet para que la colecta no arranque vacía.</span>
            </span>
          </label>
        </Card>

        <button className={`${btn.primary} w-full py-3.5 text-base`} disabled={invalid}>
          Crear colecta en Stellar Testnet
        </button>
      </form>

      <aside className="lg:pt-16">
        <Card className="lg:sticky lg:top-24">
          <h2 className="font-bold">Qué se crea en Stellar</h2>
          <ul className="mt-4 space-y-3 text-sm text-stone-600">
            {[
              ['Una cuenta propia para la colecta', 'El dinero no pasa por la cuenta de nadie.'],
              ['3 firmantes con peso 1', 'Cada firmante tiene su propia llave.'],
              ['Umbral 2 para cualquier operación', 'Un pago con una sola firma es rechazado por la red.'],
              ['Llave maestra desactivada', 'Ni siquiera quien creó la cuenta puede mover fondos solo.'],
              ['Título, meta y nombres on-chain', 'Cualquiera con el enlace ve lo mismo, sin base de datos.'],
            ].map(([t, d]) => (
              <li key={t} className="flex gap-3">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700">
                  <svg className="size-3" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </span>
                <span>
                  <strong className="text-ink">{t}.</strong> {d}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </aside>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex justify-between text-sm font-semibold">
        {label}
        {error && <span className="font-medium text-red-600">{error}</span>}
      </span>
      {children}
    </label>
  )
}
