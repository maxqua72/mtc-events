// tests/server/auth.test.ts
// Matrice di autorizzazione: anonimo, utente inesistente, manager dell'ASD,
// manager di un'altra ASD, manager "storico" (managed_asds nel documento utente), admin.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ObjectId } from 'mongodb'
import { createFakeDb, fakeEvent } from '../helpers/fake-db'
import {
  getSessionDbUser,
  requireAdmin,
  requireAsdManager,
  canManageAsd
} from '../../server/utils/auth'

const ids = {
  admin: new ObjectId(),
  adminString: new ObjectId(),
  managerA: new ObjectId(),
  legacyManagerA: new ObjectId(),
  plainUser: new ObjectId(),
  asdA: new ObjectId(),
  asdB: new ObjectId()
}

const asdA = { _id: ids.asdA, slug: 'asd-a', name: 'ASD A' }
const asdB = { _id: ids.asdB, slug: 'asd-b', name: 'ASD B' }

const data = {
  users: [
    { _id: ids.admin, email: 'admin@test', is_admin: true },
    { _id: ids.adminString, email: 'admin2@test', is_admin: 'true' },
    { _id: ids.managerA, email: 'mgr@test', is_admin: false },
    { _id: ids.legacyManagerA, email: 'legacy@test', is_admin: false, managed_asds: [{ asd_slug: 'asd-a' }] },
    { _id: ids.plainUser, email: 'user@test', is_admin: false }
  ],
  associations: [asdA, asdB],
  managers: [
    { _id: new ObjectId(), user_id: ids.managerA, association_id: ids.asdA, role: 'MANAGER' }
  ]
}

// Imposta l'utente della sessione per il prossimo test (null = anonimo)
let sessionUser: any = null
const loginAs = (id: ObjectId | string | null, extra: Record<string, any> = {}) => {
  sessionUser = id === null ? null : { id: id.toString(), ...extra }
}

beforeEach(() => {
  sessionUser = null
  vi.stubGlobal('getDb', async () => createFakeDb(data))
  vi.stubGlobal('getUserSession', async () => (sessionUser ? { user: sessionUser } : {}))
})

const statusOf = async (promise: Promise<unknown>) => {
  try {
    await promise
    return 200
  } catch (e: any) {
    return e.statusCode
  }
}

describe('getSessionDbUser', () => {
  it('restituisce null senza sessione', async () => {
    expect(await getSessionDbUser(fakeEvent())).toBeNull()
  })

  it('restituisce null con un id non valido', async () => {
    loginAs('non-un-object-id')
    expect(await getSessionDbUser(fakeEvent())).toBeNull()
  })

  it('restituisce null se l\'utente non esiste più nel DB', async () => {
    loginAs(new ObjectId())
    expect(await getSessionDbUser(fakeEvent())).toBeNull()
  })

  it('rilegge l\'utente dal DB', async () => {
    loginAs(ids.managerA)
    const user = await getSessionDbUser(fakeEvent())
    expect(user?.email).toBe('mgr@test')
  })
})

describe('requireAdmin', () => {
  it('401 senza sessione', async () => {
    expect(await statusOf(requireAdmin(fakeEvent()))).toBe(401)
  })

  it('403 per un manager', async () => {
    loginAs(ids.managerA)
    expect(await statusOf(requireAdmin(fakeEvent()))).toBe(403)
  })

  it('ignora is_admin scritto nel cookie: conta solo il DB', async () => {
    loginAs(ids.plainUser, { is_admin: true })
    expect(await statusOf(requireAdmin(fakeEvent()))).toBe(403)
  })

  it('consente l\'accesso all\'admin (anche con is_admin salvato come stringa)', async () => {
    loginAs(ids.admin)
    expect(await statusOf(requireAdmin(fakeEvent()))).toBe(200)
    loginAs(ids.adminString)
    expect(await statusOf(requireAdmin(fakeEvent()))).toBe(200)
  })
})

describe('requireAsdManager', () => {
  it('401 senza sessione', async () => {
    expect(await statusOf(requireAsdManager(fakeEvent(), 'asd-a'))).toBe(401)
  })

  it('consente al manager la propria ASD e restituisce l\'ASD', async () => {
    loginAs(ids.managerA)
    const { asd } = await requireAsdManager(fakeEvent(), 'asd-a')
    expect(asd?.slug).toBe('asd-a')
  })

  it('403 sul manager di un\'altra ASD', async () => {
    loginAs(ids.managerA)
    expect(await statusOf(requireAsdManager(fakeEvent(), 'asd-b'))).toBe(403)
  })

  it('ignora managed_asds scritto nel cookie: conta solo il DB', async () => {
    loginAs(ids.managerA, { managed_asds: [{ asd_slug: 'asd-b' }] })
    expect(await statusOf(requireAsdManager(fakeEvent(), 'asd-b'))).toBe(403)
  })

  it('403 su uno slug inesistente per chi non è admin', async () => {
    loginAs(ids.managerA)
    expect(await statusOf(requireAsdManager(fakeEvent(), 'non-esiste'))).toBe(403)
  })

  it('accetta i manager storici con managed_asds nel documento utente', async () => {
    loginAs(ids.legacyManagerA)
    expect(await statusOf(requireAsdManager(fakeEvent(), 'asd-a'))).toBe(200)
    expect(await statusOf(requireAsdManager(fakeEvent(), 'asd-b'))).toBe(403)
  })

  it('l\'admin gestisce tutte le ASD, anche uno slug non ancora creato', async () => {
    loginAs(ids.admin)
    expect(await statusOf(requireAsdManager(fakeEvent(), 'asd-b'))).toBe(200)
    const { asd } = await requireAsdManager(fakeEvent(), 'non-esiste')
    expect(asd).toBeNull()
  })
})

describe('canManageAsd', () => {
  it('false per utente nullo o ASD nulla', async () => {
    expect(await canManageAsd(null, asdA)).toBe(false)
    expect(await canManageAsd({ _id: ids.managerA }, null)).toBe(false)
  })

  it('true per il manager della propria ASD, false per le altre', async () => {
    const user = data.users.find(u => u._id === ids.managerA)
    expect(await canManageAsd(user, asdA)).toBe(true)
    expect(await canManageAsd(user, asdB)).toBe(false)
  })
})
