import { describe, expect, it } from 'vitest'
import { resolveApiAuthAction } from '../../app/utils/api-auth-errors'

describe('resolveApiAuthAction', () => {
  it('ignora gli errori che non sono 401/403', () => {
    expect(resolveApiAuthAction('/api/admin/associations', 500, '/admin')).toEqual({ type: 'none' })
    expect(resolveApiAuthAction('/api/admin/associations', 404, '/admin')).toEqual({ type: 'none' })
  })

  it('ignora le API non protette (login, verify-token, pubbliche)', () => {
    expect(resolveApiAuthAction('/api/auth/login', 401, '/login')).toEqual({ type: 'none' })
    expect(resolveApiAuthAction('/api/asd/club/verify-token?token=x', 401, '/club/join')).toEqual({ type: 'none' })
    expect(resolveApiAuthAction('/api/administrator', 401, '/admin')).toEqual({ type: 'none' })
    expect(resolveApiAuthAction('/api/managers', 403, '/admin')).toEqual({ type: 'none' })
  })

  it('401 su una pagina admin: login con ritorno alla pagina', () => {
    expect(resolveApiAuthAction('/api/admin/associations', 401, '/admin/legal'))
      .toEqual({ type: 'relogin', to: '/login?redirect=%2Fadmin%2Flegal' })
  })

  it('401 su una pagina manager: /<slug>/join', () => {
    expect(resolveApiAuthAction('/api/manager/club/events', 401, '/club/manager/events'))
      .toEqual({ type: 'relogin', to: '/club/join' })
  })

  it('401 altrove: /login', () => {
    expect(resolveApiAuthAction('/api/manager/club/resources', 401, '/club/events'))
      .toEqual({ type: 'relogin', to: '/login' })
  })

  it('403: pagina "Permesso negato"', () => {
    expect(resolveApiAuthAction('/api/manager/club/events', 403, '/club/manager/events')).toEqual({ type: 'forbidden' })
    expect(resolveApiAuthAction('/api/admin', 403, '/admin')).toEqual({ type: 'forbidden' })
  })

  it('riconosce URL assoluti, Request, slash doppi e maiuscole', () => {
    expect(resolveApiAuthAction('https://example.org/api/admin/users', 403, '/admin').type).toBe('forbidden')
    expect(resolveApiAuthAction({ url: '/api/admin/users' }, 403, '/admin').type).toBe('forbidden')
    expect(resolveApiAuthAction('//api//Admin/users', 403, '/admin').type).toBe('forbidden')
  })
})
