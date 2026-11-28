import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isLocalConnection, requireCronSecret } from '../../server/utils/cron-auth'

const SECRET = 'cron-secret-di-test-0123456789abcdef'

const cronEvent = (authorization?: string, remoteAddress = '127.0.0.1', extraHeaders: Record<string, string> = {}) => ({
  path: '/api/cron/rolling',
  context: {},
  node: {
    req: {
      headers: { ...(authorization === undefined ? {} : { authorization }), ...extraHeaders },
      socket: { remoteAddress }
    }
  }
}) as any

const statusOf = (fn: () => unknown) => {
  try { fn() } catch (e: any) { return e.statusCode }
  return 200
}

describe('requireCronSecret', () => {
  const original = process.env.CRON_SECRET
  beforeEach(() => {
    process.env.CRON_SECRET = SECRET
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    if (original === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = original
  })

  it('accetta il segreto corretto', () => {
    expect(statusOf(() => requireCronSecret(cronEvent(`Bearer ${SECRET}`)))).toBe(200)
  })

  it('accetta "bearer" minuscolo e spazi in più', () => {
    expect(statusOf(() => requireCronSecret(cronEvent(`bearer   ${SECRET}`)))).toBe(200)
  })

  it('401 senza header', () => {
    expect(statusOf(() => requireCronSecret(cronEvent()))).toBe(401)
  })

  it('401 con segreto sbagliato o troncato', () => {
    expect(statusOf(() => requireCronSecret(cronEvent('Bearer sbagliato')))).toBe(401)
    expect(statusOf(() => requireCronSecret(cronEvent(`Bearer ${SECRET.slice(0, -1)}`)))).toBe(401)
    expect(statusOf(() => requireCronSecret(cronEvent(`Bearer ${SECRET}x`)))).toBe(401)
  })

  it('401 con il segreto senza "Bearer"', () => {
    expect(statusOf(() => requireCronSecret(cronEvent(SECRET)))).toBe(401)
  })

  it('503 se CRON_SECRET manca: "Bearer undefined" non passa più', () => {
    delete process.env.CRON_SECRET
    expect(statusOf(() => requireCronSecret(cronEvent('Bearer undefined')))).toBe(503)
    expect(statusOf(() => requireCronSecret(cronEvent('Bearer ')))).toBe(503)
  })

  it('503 se CRON_SECRET è vuoto o troppo corto', () => {
    process.env.CRON_SECRET = '   '
    expect(statusOf(() => requireCronSecret(cronEvent('Bearer    ')))).toBe(503)
    process.env.CRON_SECRET = 'corto'
    expect(statusOf(() => requireCronSecret(cronEvent('Bearer corto')))).toBe(503)
  })
})

describe('isLocalConnection', () => {
  it('vero per 127.0.0.1, ::1 e ::ffff:127.0.0.1', () => {
    expect(isLocalConnection(cronEvent(undefined, '127.0.0.1'))).toBe(true)
    expect(isLocalConnection(cronEvent(undefined, '::1'))).toBe(true)
    expect(isLocalConnection(cronEvent(undefined, '::ffff:127.0.0.1'))).toBe(true)
  })

  it('falso per un indirizzo remoto', () => {
    expect(isLocalConnection(cronEvent(undefined, '203.0.113.7'))).toBe(false)
  })

  it('ignora X-Forwarded-For falsificato', () => {
    const event = cronEvent(undefined, '203.0.113.7', { 'x-forwarded-for': '127.0.0.1' })
    expect(isLocalConnection(event)).toBe(false)
  })

  it('falso se l\'indirizzo non è disponibile', () => {
    expect(isLocalConnection({ node: { req: {} } } as any)).toBe(false)
  })

  it('fuori dallo sviluppo X-Forwarded-For non conta neanche senza socket', () => {
    const event = { node: { req: { headers: { 'x-forwarded-for': '127.0.0.1' }, socket: {} } } } as any
    expect(isLocalConnection(event, { trustLastForwardedHop: false })).toBe(false)
  })

  it('in sviluppo (proxy di nuxi, socket senza indirizzo) conta solo l\'ultimo valore', () => {
    const viaProxy = (xff: string) => ({ node: { req: { headers: { 'x-forwarded-for': xff }, socket: {} } } }) as any
    expect(isLocalConnection(viaProxy('::1'), { trustLastForwardedHop: true })).toBe(true)
    // il client ha scritto "127.0.0.1", il proxy ha aggiunto l'indirizzo reale
    expect(isLocalConnection(viaProxy('127.0.0.1, 203.0.113.7'), { trustLastForwardedHop: true })).toBe(false)
  })

  it('in sviluppo il socket, se presente, ha la precedenza', () => {
    const event = cronEvent(undefined, '203.0.113.7', { 'x-forwarded-for': '127.0.0.1' })
    expect(isLocalConnection(event, { trustLastForwardedHop: true })).toBe(false)
  })
})
