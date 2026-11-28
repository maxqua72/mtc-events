// tests/helpers/fake-db.ts
// Database in memoria minimo, sufficiente per i findOne con filtri di uguaglianza
// usati dagli helper di autorizzazione. Gli ObjectId sono confrontati come stringhe.
type Doc = Record<string, any>

const same = (a: any, b: any) => {
  if (a && typeof a === 'object' && typeof a.toHexString === 'function') a = a.toHexString()
  if (b && typeof b === 'object' && typeof b.toHexString === 'function') b = b.toHexString()
  return a === b
}

const matches = (doc: Doc, filter: Doc) =>
  Object.entries(filter).every(([key, value]) => same(doc[key], value))

export const createFakeDb = (data: Record<string, Doc[]>) => ({
  collection: (name: string) => ({
    findOne: async (filter: Doc) => (data[name] || []).find(doc => matches(doc, filter)) || null
  })
})

/** Evento h3 minimo: basta il path per il middleware */
export const fakeEvent = (path = '/') => ({ path, context: {} }) as any
