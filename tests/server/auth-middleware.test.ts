// tests/server/auth-middleware.test.ts
// Verifica quali percorsi il middleware protegge e con quale controllo.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fakeEvent } from '../helpers/fake-db'

const requireAdmin = vi.fn(async () => ({ _id: 'admin' }))
const requireAsdManager = vi.fn(async (_event: any, slug: string) => ({ user: { _id: 'mgr' }, asd: { slug } }))

let middleware: (event: any) => Promise<unknown>

beforeEach(async () => {
  requireAdmin.mockClear()
  requireAsdManager.mockClear()
  vi.stubGlobal('requireAdmin', requireAdmin)
  vi.stubGlobal('requireAsdManager', requireAsdManager)
  middleware = (await import('../../server/middleware/auth')).default as any
})

describe('middleware auth', () => {
  it.each([
    '/api/admin/associations',
    '/api/admin/associations/123/managers',
    '/api/admin',
    '//api/admin/associations',
    '/api//admin/users/search',
    '/API/Admin/associations',
    '/api/%61dmin/associations'
  ])('richiede l\'admin su %s', async (path) => {
    await middleware(fakeEvent(path))
    expect(requireAdmin).toHaveBeenCalledTimes(1)
    expect(requireAsdManager).not.toHaveBeenCalled()
  })

  it.each([
    ['/api/manager/asd-a/events', 'asd-a'],
    ['/api/manager/asd-a/memberships/123/send-invite', 'asd-a'],
    ['/api//manager/asd-b/info', 'asd-b'],
    ['/api/manager/asd-a/info?x=1', 'asd-a']
  ])('richiede il manager dello slug su %s', async (path, slug) => {
    const event = fakeEvent(path)
    await middleware(event)
    expect(requireAsdManager).toHaveBeenCalledWith(event, slug)
    expect(event.context.authAsd).toEqual({ slug })
    expect(requireAdmin).not.toHaveBeenCalled()
  })

  it.each([
    '/',
    '/admin',
    '/api/asd/asd-a/events',
    '/api/events/123',
    '/api/auth/login',
    '/api/administrator',
    '/api/managers'
  ])('non interviene su %s', async (path) => {
    await middleware(fakeEvent(path))
    expect(requireAdmin).not.toHaveBeenCalled()
    expect(requireAsdManager).not.toHaveBeenCalled()
  })

  it('400 su un percorso con codifica non valida', async () => {
    await expect(middleware(fakeEvent('/api/admin/%E0%A4%A'))).rejects.toMatchObject({ statusCode: 400 })
  })

  it('propaga il 401/403 degli helper', async () => {
    requireAdmin.mockRejectedValueOnce(Object.assign(new Error('no'), { statusCode: 401 }))
    await expect(middleware(fakeEvent('/api/admin/associations'))).rejects.toMatchObject({ statusCode: 401 })
  })
})
