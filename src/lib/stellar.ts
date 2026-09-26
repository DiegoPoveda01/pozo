// Toda la interacción real con Stellar Testnet vive en este archivo.
// Horizon (lectura/envío de transacciones) + Friendbot (XLM de prueba).
import {
  Asset,
  BASE_FEE,
  Horizon,
  Keypair,
  Memo,
  Networks,
  NotFoundError,
  Operation,
  TimeoutInfinite,
  Transaction,
  TransactionBuilder,
} from '@stellar/stellar-sdk'

export const HORIZON_URL = 'https://horizon-testnet.stellar.org'
export const NETWORK = Networks.TESTNET
export const EXPLORER = 'https://stellar.expert/explorer/testnet'
export const server = new Horizon.Server(HORIZON_URL)

// Reserva mínima con la que nace la cuenta de la colecta (paga base reserve + firmantes + metadatos).
// No cuenta como aporte: se muestra aparte en el libro de cuentas.
export const TREASURY_STARTING_BALANCE = '12'
export const MEMO_MAX_BYTES = 28

export const txUrl = (hash: string) => `${EXPLORER}/tx/${hash}`
export const accountUrl = (addr: string) => `${EXPLORER}/account/${addr}`
export const byteLength = (s: string) => new TextEncoder().encode(s).length

export function clampMemo(s: string) {
  let out = s.trim()
  while (byteLength(out) > MEMO_MAX_BYTES) out = out.slice(0, -1)
  return out
}

// ---------- Errores legibles ----------

export class StellarError extends Error {
  code?: string
  constructor(message: string, code?: string) {
    super(message)
    this.code = code
  }
}

const CODE_MESSAGES: Record<string, string> = {
  tx_bad_auth: 'Faltan firmas: la cuenta de la colecta exige 2 de 3 firmantes para mover dinero.',
  tx_bad_seq: 'La propuesta quedó desactualizada (hubo otro movimiento). Créala de nuevo.',
  tx_insufficient_balance: 'La billetera no tiene saldo suficiente.',
  op_underfunded: 'Saldo insuficiente para este pago.',
  op_no_destination: 'La cuenta de destino no existe en la red.',
  op_low_reserve: 'El pago dejaría la cuenta por debajo de su reserva mínima.',
}

export function toStellarError(e: unknown): StellarError {
  if (e instanceof StellarError) return e
  const codes = (e as { response?: { data?: { extras?: { result_codes?: { transaction?: string; operations?: string[] } } } } })?.response?.data?.extras
    ?.result_codes
  if (codes) {
    const code = codes.operations?.find((c) => c !== 'op_success') ?? codes.transaction ?? 'tx_failed'
    return new StellarError(CODE_MESSAGES[code] ?? `La red rechazó la transacción (${code}).`, code)
  }
  if (e instanceof NotFoundError) return new StellarError('La cuenta no existe en Stellar Testnet.', 'not_found')
  if (e instanceof TypeError) return new StellarError('No se pudo conectar con Stellar Testnet. Revisa tu conexión.', 'network')
  return new StellarError(e instanceof Error ? e.message : 'Error desconocido')
}

// ---------- Friendbot ----------

export async function fundWithFriendbot(publicKey: string) {
  const res = await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(publicKey)}`)
  if (!res.ok) {
    // Friendbot responde 400 si la cuenta ya existe: en ese caso está todo bien.
    const exists = await server.loadAccount(publicKey).then(
      () => true,
      () => false,
    )
    if (!exists) throw new StellarError('Friendbot (el grifo de XLM de prueba) no respondió. Intenta de nuevo en unos segundos.', 'friendbot')
  }
}

// ---------- Crear colecta ----------

export interface SignerInput {
  name: string
  role: string
}

export interface CreateCampaignInput {
  title: string
  description: string
  goal: number
  signers: [SignerInput, SignerInput, SignerInput] // [organizador, tesorero/a, tesorero/a]
  vendors: string[]
}

export interface CampaignKeys {
  treasury: string
  signers: { name: string; role: string; publicKey: string; secret: string }[]
}

// Una sola transacción atómica crea la cuenta de la colecta, publica sus metadatos,
// agrega 3 firmantes, exige 2 firmas para cualquier operación y desactiva la llave maestra.
export async function createCampaign(input: CreateCampaignInput, onStep: (i: number) => void) {
  const funder = Keypair.random()
  const treasury = Keypair.random()
  const signerKeys = input.signers.map(() => Keypair.random())
  const vendorKeys = input.vendors.map(() => Keypair.random())

  onStep(0)
  await fundWithFriendbot(funder.publicKey())

  onStep(1)
  const funderAccount = await server.loadAccount(funder.publicKey())
  const t = treasury.publicKey()
  const b = new TransactionBuilder(funderAccount, { fee: BASE_FEE, networkPassphrase: NETWORK })
    .addOperation(Operation.createAccount({ destination: t, startingBalance: TREASURY_STARTING_BALANCE }))
    .addOperation(Operation.manageData({ source: t, name: 'cc:t', value: input.title }))
    .addOperation(Operation.manageData({ source: t, name: 'cc:g', value: String(input.goal) }))
  if (input.description) b.addOperation(Operation.manageData({ source: t, name: 'cc:d', value: input.description }))
  input.signers.forEach((s, i) => {
    const pk = signerKeys[i].publicKey()
    b.addOperation(Operation.manageData({ source: t, name: `cc:n:${pk}`, value: `${s.name}|${s.role}` }))
    b.addOperation(Operation.setOptions({ source: t, signer: { ed25519PublicKey: pk, weight: 1 } }))
  })
  // Proveedores de ejemplo: cuentas reales creadas en la misma transacción para poder pagarles.
  input.vendors.forEach((name, i) => {
    const pk = vendorKeys[i].publicKey()
    b.addOperation(Operation.createAccount({ destination: pk, startingBalance: '1' }))
    b.addOperation(Operation.manageData({ source: t, name: `cc:v:${pk}`, value: name }))
  })
  b.addOperation(Operation.setOptions({ source: t, masterWeight: 0, lowThreshold: 2, medThreshold: 2, highThreshold: 2 }))
  const tx = b.setTimeout(120).build()
  tx.sign(funder, treasury)
  const res = await server.submitTransaction(tx).catch((e) => {
    throw toStellarError(e)
  })

  const keys: CampaignKeys = {
    treasury: t,
    signers: input.signers.map((s, i) => ({ ...s, publicKey: signerKeys[i].publicKey(), secret: signerKeys[i].secret() })),
  }
  return { keys, funderSecret: funder.secret(), hash: res.hash }
}

// ---------- Aportar ----------

export async function sendPayment(fromSecret: string, destination: string, amount: string, memo: string) {
  const kp = Keypair.fromSecret(fromSecret)
  try {
    const account = await server.loadAccount(kp.publicKey())
    const b = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK })
      .addOperation(Operation.payment({ destination, asset: Asset.native(), amount }))
      .setTimeout(60)
    const m = clampMemo(memo)
    if (m) b.addMemo(Memo.text(m))
    const tx = b.build()
    tx.sign(kp)
    const res = await server.submitTransaction(tx)
    return { hash: res.hash, ledger: res.ledger }
  } catch (e) {
    throw toStellarError(e)
  }
}

// ---------- Gastos multifirma ----------

// El organizador arma el pago desde la cuenta de la colecta y lo firma (1 de 2 firmas necesarias).
// Sin vencimiento, para que el/la cotitular pueda aprobarlo cuando lo revise.
export async function buildExpense(treasury: string, destination: string, amount: string, concept: string, signerSecret: string) {
  try {
    const account = await server.loadAccount(treasury)
    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK })
      .addOperation(Operation.payment({ destination, asset: Asset.native(), amount }))
      .addMemo(Memo.text(clampMemo(concept)))
      .setTimeout(TimeoutInfinite)
      .build()
    tx.sign(Keypair.fromSecret(signerSecret))
    return tx.toXDR()
  } catch (e) {
    throw toStellarError(e)
  }
}

export function addSignature(xdr: string, signerSecret: string) {
  const tx = TransactionBuilder.fromXDR(xdr, NETWORK) as Transaction
  tx.sign(Keypair.fromSecret(signerSecret))
  return tx.toXDR()
}

export async function submitXdr(xdr: string) {
  try {
    const res = await server.submitTransaction(TransactionBuilder.fromXDR(xdr, NETWORK) as Transaction)
    return { hash: res.hash, ledger: res.ledger }
  } catch (e) {
    throw toStellarError(e)
  }
}

// ---------- Lectura de la colecta (todo sale de la blockchain) ----------

export interface Signer {
  publicKey: string
  weight: number
  name: string
  role: string
}

export interface Campaign {
  address: string
  title: string
  description: string
  goal: number
  signers: Signer[]
  masterWeight: number
  thresholds: { low: number; med: number; high: number }
  vendors: Record<string, string>
  balance: number
}

const decode = (b64: string) => new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)))

export async function loadCampaign(address: string): Promise<Campaign> {
  try {
    const acc = await server.loadAccount(address)
    const data: Record<string, string> = {}
    for (const [k, v] of Object.entries(acc.data_attr)) data[k] = decode(v)
    const vendors: Record<string, string> = {}
    for (const [k, v] of Object.entries(data)) if (k.startsWith('cc:v:')) vendors[k.slice(5)] = v
    const signers = acc.signers
      .filter((s) => s.key !== address)
      .map((s) => {
        const [name = 'Firmante', role = ''] = (data[`cc:n:${s.key}`] ?? '').split('|')
        return { publicKey: s.key, weight: s.weight, name, role }
      })
    return {
      address,
      title: data['cc:t'] ?? 'Colecta sin título',
      description: data['cc:d'] ?? '',
      goal: Number(data['cc:g'] ?? 0),
      signers,
      masterWeight: acc.signers.find((s) => s.key === address)?.weight ?? 0,
      thresholds: { low: acc.thresholds.low_threshold, med: acc.thresholds.med_threshold, high: acc.thresholds.high_threshold },
      vendors,
      balance: Number(acc.balances.find((x) => x.asset_type === 'native')?.balance ?? 0),
    }
  } catch (e) {
    throw toStellarError(e)
  }
}

export interface LedgerEntry {
  id: string
  kind: 'in' | 'out' | 'created'
  amount: number
  counterparty: string
  memo: string
  hash: string
  ledger: number
  signatures: number
  createdAt: string
}

export async function loadLedger(address: string): Promise<LedgerEntry[]> {
  const page = await server.payments().forAccount(address).join('transactions').order('desc').limit(200).call()
  const out: LedgerEntry[] = []
  for (const r of page.records as unknown as Record<string, unknown>[]) {
    const tx = r.transaction_attr as { memo?: string; ledger_attr: number; signatures: string[] } | undefined
    const base = {
      id: r.id as string,
      hash: r.transaction_hash as string,
      memo: tx?.memo ?? '',
      ledger: tx?.ledger_attr ?? 0,
      signatures: tx?.signatures.length ?? 0,
      createdAt: r.created_at as string,
    }
    if (r.type === 'create_account' && r.account === address) {
      out.push({ ...base, kind: 'created', amount: Number(r.starting_balance), counterparty: r.funder as string })
    } else if (r.type === 'payment' && r.asset_type === 'native') {
      const incoming = r.to === address
      out.push({ ...base, kind: incoming ? 'in' : 'out', amount: Number(r.amount), counterparty: (incoming ? r.from : r.to) as string })
    }
  }
  return out
}
