import { useEffect, type ReactNode } from 'react'
import { go } from '../lib/format'
import { Avatar, Check } from './ui'

// Presentación de apoyo para el pitch (#/pitch). Se avanza con flechas, espacio o tocando la pantalla;
// la última diapositiva entra a la app.

interface Slide {
  dark?: boolean
  body: ReactNode
}

const Big = ({ children }: { children: ReactNode }) => <h1 className="text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl">{children}</h1>
const Kicker = ({ children }: { children: ReactNode }) => <p className="mb-4 text-sm font-bold uppercase tracking-widest text-brand-600">{children}</p>
const Line = ({ children, delay = 0 }: { children: ReactNode; delay?: number }) => (
  <p className="animate-rise text-xl font-semibold text-stone-700 sm:text-3xl" style={{ animationDelay: `${delay}ms` }}>
    {children}
  </p>
)

const slides: Slide[] = [
  {
    body: (
      <div className="grid items-center gap-10 md:grid-cols-[1.2fr_1fr]">
        <Big>
          ¿Cuántos de ustedes han enviado plata para una junta o un regalo… <span className="text-brand-700">y después mandan un pantallazo por WhatsApp?</span>
        </Big>
        <div className="animate-rise space-y-2 rounded-3xl bg-[#e7ddd3] p-5 [animation-delay:300ms]" aria-hidden>
          <Bubble from="Cami">Ya transferí mis 5 lucas 🙌</Bubble>
          <Bubble from="Cami">
            <span className="block h-24 w-40 rounded-lg bg-stone-200 text-center text-xs leading-[6rem] text-stone-500">pantallazo.jpg</span>
          </Bubble>
          <Bubble from="Tomás">Listo, yo también 👍</Bubble>
          <Bubble mine>¿Y lo que sobró? 🤔</Bubble>
        </div>
      </div>
    ),
  },
  {
    body: (
      <Big>
        ¿Saben lo que pasa con <span className="text-brand-700">lo que sobró?</span>
      </Big>
    ),
  },
  {
    body: (
      <div className="space-y-6">
        <Kicker>El problema</Kicker>
        <Line>💸 Este dinero termina en la cuenta de una persona.</Line>
        <Line delay={400}>📱 Se rinde con un pantallazo.</Line>
        <Line delay={800}>❓ Nadie sabe qué pasa con lo que sobra.</Line>
      </div>
    ),
  },
  {
    dark: true,
    body: (
      <div>
        <p className="text-2xl font-semibold text-white/60 sm:text-3xl">Hay muchas plataformas de donaciones, pero…</p>
        <h1 className="mt-6 animate-rise text-4xl font-extrabold leading-[1.1] tracking-tight [animation-delay:400ms] sm:text-6xl">
          nosotros somos <span className="text-brand-100">la tesorería del grupo de WhatsApp.</span>
        </h1>
        <p className="mt-8 inline-flex animate-rise items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-lg font-semibold [animation-delay:900ms]">
          <StellarMark /> Y todo funciona sobre Stellar
        </p>
      </div>
    ),
  },
  {
    body: (
      <div className="grid items-center gap-10 md:grid-cols-[1.2fr_1fr]">
        <div className="space-y-5">
          <Kicker>Pregunta 1</Kicker>
          <Big>¿Quién puede mover la plata?</Big>
          <Line delay={300}>Nadie solo. La plata queda en una cuenta en Stellar que no es de ninguna persona.</Line>
          <Line delay={600}>
            Para sacar plata se necesitan <strong className="text-brand-700">2 de 3 firmas</strong>.
          </Line>
        </div>
        <div className="animate-rise space-y-3 rounded-3xl border border-stone-200 bg-white p-6 shadow-xl [animation-delay:500ms]" aria-hidden>
          {[
            ['Marta', 'Organizadora', true],
            ['Luis', 'Tesorero', true],
            ['Ana', 'Tesorera', false],
          ].map(([name, role, ok]) => (
            <div key={name as string} className="flex items-center gap-3">
              <Avatar name={name as string} />
              <p className="flex-1 font-semibold">
                {name} <span className="font-normal text-stone-500">· {role}</span>
              </p>
              {ok ? <Check className="size-6 text-brand-600" /> : <span className="text-sm text-stone-400">—</span>}
            </div>
          ))}
          <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            Si alguien intenta pagar solo, Stellar lo rechaza al tiro <span className="font-mono text-xs">tx_bad_auth</span>
          </div>
          <p className="text-sm text-stone-500">Esa regla es de Stellar, no nuestra: ni nosotros podemos saltárnosla.</p>
        </div>
      </div>
    ),
  },
  {
    body: (
      <div className="grid items-center gap-10 md:grid-cols-[1.1fr_1fr]">
        <div className="space-y-5">
          <Kicker>Pregunta 2</Kicker>
          <Big>¿Cómo se entera el grupo?</Big>
          <Line delay={300}>Con un botón, la rendición llega al WhatsApp, con un link para revisarlo directo en Stellar.</Line>
          <Line delay={600}>
            Nadie puede editar ni borrar lo que quedó en Stellar. <strong className="text-brand-700">Se acabó el pantallazo.</strong>
          </Line>
        </div>
        <div className="animate-rise rounded-3xl bg-[#e7ddd3] p-5 [animation-delay:500ms]" aria-hidden>
          <div className="ml-auto max-w-sm rounded-2xl rounded-tr-sm bg-[#d9fdd3] p-4 text-sm leading-relaxed shadow-sm">
            <p className="font-bold">Techo nuevo para el comedor · rendición de cuentas</p>
            <p className="mt-2">
              Recaudado: 580 XLM (4 aportes)
              <br />
              Gastado: 120 XLM
              <br />
              Devuelto a aportantes: 460 XLM
              <br />
              Último gasto: 120 XLM → Fletes Rápido Sur (2 firmas)
            </p>
            <p className="mt-2">Ningún pago sale sin 2 de 3 firmas. Cada movimiento se verifica en Stellar:</p>
            <p className="mt-1 truncate text-sky-700 underline">{window.location.host}/#/c/GAHK…WSAT</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    body: (
      <div className="grid items-center gap-10 md:grid-cols-[1.1fr_1fr]">
        <div className="space-y-5">
          <Kicker>Pregunta 3</Kicker>
          <Big>¿Qué pasa con lo que sobra?</Big>
          <Line delay={300}>Vuelve a cada uno, según lo que puso. Si pusiste el doble, te vuelve el doble.</Line>
          <Line delay={600}>
            En Stellar va en <strong className="text-brand-700">una sola transacción</strong>: le llega a todos al mismo tiempo, o a nadie.
          </Line>
        </div>
        <div className="animate-rise overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xl [animation-delay:500ms]" aria-hidden>
          <p className="border-b border-stone-100 px-6 py-4 font-bold">Sobraron 460 · se devuelven así</p>
          <table className="num w-full text-left">
            <thead className="text-sm text-stone-500">
              <tr>
                <th className="px-6 py-2 font-semibold">Aporte</th>
                <th className="px-6 py-2 text-right font-semibold">Puso</th>
                <th className="px-6 py-2 text-right font-semibold">Recibe</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Club Deportivo Sur', '300', '237,93'],
                ['Doña Rosa', '150', '118,97'],
                ['Vecinos del bloque 4', '80', '63,45'],
                ['Diego', '50', '39,66'],
              ].map(([n, p, r]) => (
                <tr key={n} className="border-t border-stone-100">
                  <td className="px-6 py-3 font-semibold">{n}</td>
                  <td className="px-6 py-3 text-right text-stone-500">{p}</td>
                  <td className="px-6 py-3 text-right font-bold text-sky-700">{r}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
  {
    dark: true,
    body: (
      <div>
        <p className="mb-8 text-sm font-bold uppercase tracking-widest text-brand-100/70">Por qué Stellar</p>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="animate-rise rounded-3xl bg-white/5 p-8 ring-1 ring-white/10">
            <p className="num text-6xl font-extrabold text-brand-100">5 s</p>
            <p className="mt-3 text-2xl font-semibold">Cada aporte se confirma en Stellar en 5 segundos.</p>
          </div>
          <div className="animate-rise rounded-3xl bg-white/5 p-8 ring-1 ring-white/10 [animation-delay:400ms]">
            <p className="num text-6xl font-extrabold text-brand-100">
              ≈ $0 <span className="text-3xl text-white/40 line-through">10%</span>
            </p>
            <p className="mt-3 text-2xl font-semibold">La comisión de Stellar es una fracción de peso, no un 10% como otras plataformas.</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    body: (
      <div className="space-y-8">
        <Kicker>Modelo de negocio</Kicker>
        <Big>¿Cómo ganamos plata?</Big>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card delay={300} title="Gratis">
            Para la junta del curso o del barrio.
          </Card>
          <Card delay={600} title="Plan para organizaciones">
            Clubes, comedores, centros de alumnos y juntas de vecinos, que mueven plata todo el año. Con Stellar reciben aportes en dólares digitales y los
            cobran en efectivo.
          </Card>
        </div>
      </div>
    ),
  },
  {
    body: (
      <div className="space-y-8">
        <Kicker>Lo que buscamos</Kicker>
        <Big>¿Qué buscamos?</Big>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card delay={300} title="🤝 Pilotos">
            Organizaciones que quieran hacer un piloto con nosotros.
          </Card>
          <Card delay={600} title="🚀 Ecosistema Stellar">
            Apoyo para pasar de la red de prueba de Stellar a plata real.
          </Card>
        </div>
      </div>
    ),
  },
  {
    dark: true,
    body: (
      <div className="text-center">
        <p className="text-2xl font-semibold text-white/70 sm:text-3xl">Si tienen un grupo de WhatsApp con plata de por medio, ya saben…</p>
        <h1 className="mt-6 animate-rise text-5xl font-extrabold tracking-tight [animation-delay:400ms] sm:text-7xl">
          Cuentas claras,
          <br />
          <span className="text-brand-100">comunidad larga.</span>
        </h1>
        <a
          href="#/"
          onClick={(e) => e.stopPropagation()}
          className="mt-10 inline-flex animate-rise items-center rounded-xl bg-white px-8 py-4 text-lg font-bold text-brand-900 shadow-sm transition [animation-delay:900ms] hover:bg-brand-50"
        >
          Entrar a Cuentas Claras →
        </a>
      </div>
    ),
  },
]

export default function Pitch({ step }: { step: number }) {
  const i = Math.min(Math.max(step, 1), slides.length) - 1
  const slide = slides[i]
  const next = () => go(i + 1 < slides.length ? `pitch/${i + 2}` : '')
  const prev = () => i > 0 && go(`pitch/${i}`)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) {
        e.preventDefault()
        next()
      } else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) {
        e.preventDefault()
        prev()
      } else if (e.key === 'Escape') go('')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div
      className={`fixed inset-0 z-50 flex cursor-pointer select-none flex-col ${slide.dark ? 'bg-brand-900 text-white' : 'bg-paper text-ink'}`}
      onClick={next}
    >
      <div className="flex items-center justify-between px-6 pt-5 text-sm font-semibold opacity-60">
        <span className="flex items-center gap-2">
          <img src="/favicon.svg" alt="" className="size-6" /> Cuentas Claras
        </span>
        <span className="num">
          {i + 1} / {slides.length}
        </span>
      </div>

      <div key={i} className="mx-auto flex w-full max-w-6xl flex-1 animate-rise flex-col overflow-y-auto px-6 py-8">
        <div className="my-auto">{slide.body}</div>
      </div>

      <div className="flex items-center justify-between gap-4 px-6 pb-5">
        <button
          className="whitespace-nowrap rounded-full px-2 py-2 text-sm font-semibold opacity-60 hover:opacity-100 disabled:invisible"
          disabled={i === 0}
          onClick={(e) => {
            e.stopPropagation()
            prev()
          }}
        >
          ← Anterior
        </button>
        <div className="flex gap-1.5">
          {slides.map((_, n) => (
            <span key={n} className={`h-1.5 rounded-full transition-all ${n === i ? 'w-6 bg-brand-500' : 'w-1.5 bg-current opacity-25'}`} />
          ))}
        </div>
        <span className="whitespace-nowrap px-2 py-2 text-sm font-semibold opacity-60">{i + 1 < slides.length ? 'Siguiente →' : 'Ir a la app →'}</span>
      </div>
    </div>
  )
}

function Bubble({ children, from, mine }: { children: ReactNode; from?: string; mine?: boolean }) {
  return (
    <div className={`w-fit max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${mine ? 'ml-auto rounded-tr-sm bg-[#d9fdd3]' : 'rounded-tl-sm bg-white'}`}>
      {from && <p className="text-xs font-bold text-brand-700">{from}</p>}
      {children}
    </div>
  )
}

function Card({ title, children, delay }: { title: string; children: ReactNode; delay: number }) {
  return (
    <div className="animate-rise rounded-3xl border border-stone-200 bg-white p-7" style={{ animationDelay: `${delay}ms` }}>
      <p className="text-2xl font-bold">{title}</p>
      <p className="mt-2 text-lg text-stone-600">{children}</p>
    </div>
  )
}

function StellarMark() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
      <path d="M3 15.5 21 7M3 17l18-8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
