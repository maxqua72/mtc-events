// server/utils/cron-auth.ts
// Protezione degli endpoint interni /api/cron/*.
import { createHash, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
import { createError, getHeader } from 'h3'

// Un segreto più corto di così è considerato non configurato
export const CRON_SECRET_MIN_LENGTH = 16

const readCronSecret = (): string => {
  const secret = process.env.CRON_SECRET
  return typeof secret === 'string' ? secret.trim() : ''
}

// Confronto a tempo costante: gli hash hanno sempre la stessa lunghezza,
// quindi non si rivela nemmeno la lunghezza del segreto.
const sameSecret = (a: string, b: string) =>
  timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest())

/**
 * Richiede l'header `Authorization: Bearer <CRON_SECRET>`.
 * - 503 se CRON_SECRET manca o è troppo corto (prima si accettava "Bearer undefined");
 * - 401 se l'header manca o non corrisponde.
 */
export const requireCronSecret = (event: H3Event) => {
  const secret = readCronSecret()
  if (secret.length < CRON_SECRET_MIN_LENGTH) {
    console.error('[CRON] CRON_SECRET non configurato: richiesta rifiutata.')
    throw createError({ statusCode: 503, statusMessage: 'Cron non configurato' })
  }

  const header = getHeader(event, 'authorization') || ''
  const match = /^Bearer\s+(.+)$/i.exec(header.trim())
  if (!match || !sameSecret(match[1]!, secret)) {
    throw createError({ statusCode: 401, statusMessage: 'Non autorizzato' })
  }
}

const LOCAL_ADDRESSES = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])

/**
 * Vero se la connessione TCP arriva dalla macchina stessa.
 * Usa l'indirizzo del socket e ignora X-Forwarded-For, che il client può falsificare.
 *
 * Eccezione solo in sviluppo (`nuxi dev`): il server gira dietro il proxy di nuxi e il socket
 * non ha indirizzo; il proxy aggiunge in coda a X-Forwarded-For l'indirizzo reale, quindi
 * si usa l'ULTIMO valore (i precedenti li ha scritti il client).
 */
export const isLocalConnection = (
  event: H3Event,
  options: { trustLastForwardedHop?: boolean } = {}
) => {
  const trustLastForwardedHop = options.trustLastForwardedHop ?? Boolean(import.meta.dev)
  const socketAddress = event.node?.req?.socket?.remoteAddress
  if (typeof socketAddress === 'string' && socketAddress) return LOCAL_ADDRESSES.has(socketAddress)

  if (!trustLastForwardedHop) return false
  const forwarded = event.node?.req?.headers?.['x-forwarded-for']
  const value = Array.isArray(forwarded) ? forwarded.join(',') : forwarded
  const lastHop = typeof value === 'string' ? value.split(',').pop()?.trim() : undefined
  return !!lastHop && LOCAL_ADDRESSES.has(lastHop)
}
