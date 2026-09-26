// Estado local del navegador. Solo para la demo en testnet:
// en producción cada firmante guardaría su llave en su propia wallet (Freighter, passkey, etc.).
import type { CampaignKeys } from './stellar'

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Almacenamiento bloqueado (modo privado): la app sigue funcionando sin recordar.
  }
}

export const getKeys = (treasury: string) => read<CampaignKeys>(`cc:keys:${treasury}`)
export const saveKeys = (keys: CampaignKeys) => write(`cc:keys:${keys.treasury}`, keys)

export const getDonorSecret = () => read<string>('cc:donor')
export const saveDonorSecret = (secret: string) => write('cc:donor', secret)

export interface Proposal {
  kind?: 'expense' | 'refund'
  xdr: string
  amount: string
  destination: string
  destinationName: string
  concept: string
  signedBy: string[] // claves públicas que ya firmaron
  createdAt: number
}

export const getProposal = (treasury: string) => read<Proposal>(`cc:proposal:${treasury}`)
export const saveProposal = (treasury: string, p: Proposal | null) => write(`cc:proposal:${treasury}`, p)

export interface MyCampaign {
  address: string
  title: string
}

export const getMyCampaigns = () => read<MyCampaign[]>('cc:mine') ?? []
export const addMyCampaign = (c: MyCampaign) => write('cc:mine', [c, ...getMyCampaigns().filter((x) => x.address !== c.address)])
