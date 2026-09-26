import CampaignPage from './components/CampaignPage'
import CreateCampaign from './components/CreateCampaign'
import Landing from './components/Landing'
import Pitch from './components/Pitch'
import { btn } from './components/ui'
import { useRoute } from './lib/format'

export default function App() {
  const route = useRoute()
  const campaign = route.match(/^c\/(G[A-Z2-7]{55})$/)?.[1]
  const pitch = route.match(/^pitch(?:\/(\d+))?$/)
  if (pitch) return <Pitch step={Number(pitch[1] ?? 1)} />

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-paper/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <a href="#/" className="flex items-center gap-2.5 font-extrabold tracking-tight">
            <img src="/favicon.svg" alt="" className="size-8" />
            <span className="text-lg">Pozo</span>
          </a>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900 sm:inline-flex">
              <span className="size-1.5 rounded-full bg-amber-500" /> Stellar Testnet
            </span>
            {route !== 'crear' && (
              <a href="#/crear" className={`${btn.primary} px-4 py-2 text-sm`}>
                Crear colecta
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{campaign ? <CampaignPage key={campaign} address={campaign} /> : route === 'crear' ? <CreateCampaign /> : <Landing />}</main>

      <footer className="border-t border-stone-200 py-6 text-center text-xs text-stone-500">
        <p className="mx-auto max-w-2xl px-4">
          Demo en <strong>Stellar Testnet</strong>: los XLM de prueba no tienen valor real. Las llaves de los firmantes se guardan en este navegador solo para
          poder mostrar el flujo completo desde un único dispositivo.
        </p>
      </footer>
    </div>
  )
}
