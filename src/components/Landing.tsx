import { short } from '../lib/format'
import { getMyCampaigns } from '../lib/store'
import { Avatar, btn, Check } from './ui'

const problems = [
  {
    title: 'Comisiones que se comen la colecta',
    body: 'Las plataformas de colectas de la región pueden cobrar cerca de un 10% de cada aporte sumando plataforma y pasarela de pago.',
  },
  {
    title: '“¿Y la plata?”',
    body: 'En la colecta del barrio o del curso, el dinero termina en la cuenta personal de alguien y la rendición es una captura de pantalla en WhatsApp.',
  },
  {
    title: 'Una sola persona controla todo',
    body: 'Si quien administra se equivoca, desaparece o no rinde cuentas, nadie puede comprobar qué pasó con el dinero.',
  },
]

const steps = [
  {
    n: '1',
    title: 'Creas la colecta',
    body: 'Se abre una cuenta en Stellar con tres firmantes (tú y dos personas de confianza). Mover dinero exige 2 de las 3 firmas.',
  },
  {
    n: '2',
    title: 'Todos aportan en segundos',
    body: 'Compartes un enlace o un QR. Cada aporte llega directo a la cuenta de la colecta, confirmado en ~5 segundos.',
  },
  {
    n: '3',
    title: 'Cada gasto se aprueba y se publica',
    body: 'Para pagarle a la ferretería, alguien propone y otro aprueba. El pago queda en un libro de cuentas que cualquiera puede verificar, y la rendición llega al grupo de WhatsApp con un toque. Si sobra, vuelve a cada aportante en proporción.',
  },
]

const stellar = [
  { big: '~5 s', title: 'Confirmación final', body: 'Los aportes se ven en el libro de cuentas casi al instante.' },
  { big: '0,00001', title: 'XLM de comisión por transacción', body: 'La comisión de red es una fracción de centavo, no un porcentaje.' },
  { big: '2 de 3', title: 'Multifirma nativa', body: 'La regla vive en la cuenta de Stellar, sin smart contracts propios ni intermediarios.' },
  { big: 'USDC', title: 'Dólares digitales', body: 'En producción: aportes en USDC y retiro en efectivo por anclas y puntos de pago conectados a Stellar.' },
]

const compare = [
  ['Comisión por aporte', 'Hasta ~10%', 'Gratis, pero informal', '≈ 0 (comisión de red)'],
  ['Ver en qué se gastó', 'Depende del organizador', 'Capturas en el grupo', 'Cada pago, público'],
  ['Quién controla el dinero', 'El organizador', 'Una persona', '2 de 3 firmantes'],
  ['Lo que sobra', 'Lo decide el organizador', 'Se pierde el rastro', 'Vuelve a cada aportante, en proporción'],
  ['Verificable por cualquiera', 'No', 'No', 'Sí, en la blockchain'],
]

export default function Landing() {
  const mine = getMyCampaigns()

  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 md:grid-cols-[1.1fr_1fr] md:pt-20">
        <div className="animate-rise">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
            Colectas comunitarias sobre Stellar
          </p>
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Cuentas claras,
            <br />
            <span className="text-brand-700">comunidad larga.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-stone-600">
            Reúne dinero para el comedor del barrio, el club o el viaje de fin de curso sin tener que “confiar en el tesorero”. Cada aporte y cada gasto queda a
            la vista de todos, ningún pago sale sin la firma de dos personas y lo que sobra vuelve a quien lo puso.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#/crear" className={btn.primary}>
              Crear una colecta
            </a>
            <button className={btn.secondary} onClick={() => document.getElementById('como')?.scrollIntoView({ behavior: 'smooth' })}>
              Cómo funciona
            </button>
          </div>
          {mine.length > 0 && (
            <div className="mt-8">
              <p className="mb-2 text-sm font-semibold text-stone-500">Tus colectas en este navegador</p>
              <div className="flex flex-wrap gap-2">
                {mine.slice(0, 4).map((c) => (
                  <a
                    key={c.address}
                    href={`#/c/${c.address}`}
                    className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold hover:border-brand-500"
                  >
                    {c.title} <span className="font-mono text-xs font-medium text-stone-400">{short(c.address)}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <HeroIllustration />
      </section>

      <section className="border-y border-stone-200 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-stone-500">El problema</h2>
          <p className="mt-2 max-w-2xl text-3xl font-bold tracking-tight">Juntar plata en grupo es fácil. Rendir cuentas, no.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {problems.map((p) => (
              <div key={p.title} className="rounded-2xl bg-paper p-6">
                <h3 className="text-lg font-bold">{p.title}</h3>
                <p className="mt-2 text-stone-600">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="como" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
        <h2 className="text-sm font-bold uppercase tracking-widest text-stone-500">Cómo funciona</h2>
        <p className="mt-2 max-w-2xl text-3xl font-bold tracking-tight">Una cuenta compartida con reglas que nadie puede saltarse.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-2xl border border-stone-200 bg-white p-6">
              <span className="grid size-10 place-items-center rounded-full bg-brand-700 text-lg font-bold text-white">{s.n}</span>
              <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-stone-600">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-brand-900 py-16 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-brand-100/70">Por qué Stellar</h2>
          <p className="mt-2 max-w-2xl text-3xl font-bold tracking-tight">La confianza la pone la red, no una persona.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stellar.map((s) => (
              <div key={s.title} className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
                <p className="num text-3xl font-extrabold text-brand-100">{s.big}</p>
                <h3 className="mt-2 font-bold">{s.title}</h3>
                <p className="mt-1 text-sm text-white/70">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-sm font-bold uppercase tracking-widest text-stone-500">Comparación</h2>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-stone-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-stone-50 text-stone-500">
              <tr>
                <th className="p-4 font-semibold" />
                <th className="p-4 font-semibold">Plataformas de colecta</th>
                <th className="p-4 font-semibold">Grupo de WhatsApp + transferencia</th>
                <th className="p-4 font-bold text-brand-700">Cuentas Claras</th>
              </tr>
            </thead>
            <tbody>
              {compare.map(([label, a, b, c]) => (
                <tr key={label} className="border-t border-stone-100">
                  <td className="p-4 font-semibold">{label}</td>
                  <td className="p-4 text-stone-600">{a}</td>
                  <td className="p-4 text-stone-600">{b}</td>
                  <td className="p-4 font-semibold text-brand-700">{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-12 flex flex-col items-center gap-4 rounded-3xl bg-white p-10 text-center ring-1 ring-stone-200">
          <p className="text-2xl font-bold tracking-tight">Pruébalo en vivo en Stellar Testnet</p>
          <p className="max-w-lg text-stone-600">Crea una colecta real en la red de pruebas en ~20 segundos, aporta y aprueba un gasto con dos firmas.</p>
          <a href="#/crear" className={btn.primary}>
            Crear una colecta
          </a>
        </div>
      </section>
    </>
  )
}

// Ilustración estática del producto (no interactiva).
function HeroIllustration() {
  const rows = [
    { t: 'Doña Rosa', s: 'Aporte', a: '+150', tone: 'text-brand-700' },
    { t: 'Ferretería El Tornillo', s: 'Chapas del techo · 2 firmas', a: '−320', tone: 'text-rose-600' },
    { t: 'Club Deportivo Sur', s: 'Aporte', a: '+300', tone: 'text-brand-700' },
  ]
  return (
    <div className="relative animate-rise [animation-delay:120ms]" aria-hidden>
      <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-100 via-paper to-amber-100 blur-2xl" />
      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xl">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-700">Colecta verificable</p>
        <p className="mt-1 text-xl font-bold">Techo nuevo para el comedor</p>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-stone-100">
          <div className="h-full w-[68%] rounded-full bg-brand-600" />
        </div>
        <div className="mt-2 flex justify-between text-sm">
          <span className="num font-bold">1.020 XLM</span>
          <span className="text-stone-500">de 1.500</span>
        </div>
        <div className="mt-5 divide-y divide-stone-100">
          {rows.map((r) => (
            <div key={r.t} className="flex items-center gap-3 py-3">
              <Avatar name={r.t} tone={r.a.startsWith('+') ? 'brand' : 'amber'} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{r.t}</p>
                <p className="truncate text-xs text-stone-500">{r.s}</p>
              </div>
              <span className={`num text-sm font-bold ${r.tone}`}>{r.a}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-900">
          <Check className="size-4 text-brand-600" /> Pagos solo con 2 de 3 firmas
        </div>
      </div>
    </div>
  )
}
