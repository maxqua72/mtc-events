import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  const db = await getDb()
  const body = await readBody(event)
  const slug = getRouterParam(event, 'slug')

  const asd = await db.collection('associations').findOne({ slug })
  if (!asd) throw createError({ statusCode: 404, message: 'ASD non trovata' })

  // --- LOGICA DI CONVERSIONE ---
  // Funzione utility per convertire stringhe ISO in oggetti Date validi
  const toDate = (dateStr: string) => {
    if (!dateStr) return null
    // Aggiungendo T12:00:00, forziamo il parsing locale a mezzogiorno
    const d = new Date(`${dateStr}T12:00:00`)
    return isNaN(d.getTime()) ? null : d
  }

  // Rimuoviamo eventuali ID sporchi passati dal body per evitare conflitti
  const { _id, association_id, ...cleanBody } = body

  const newGenerator = {
    ...cleanBody,
    start_date: toDate(body.start_date),
    end_date: toDate(body.end_date),
    registration_time: toDate(body.registration_time),
    association_id: new ObjectId(asd._id), // Forza sempre ObjectId
    recurrence: {
      ...cleanBody.recurrence,
      last_rolling_date: null
    },
    status: 'active',
    created_at: new Date(),
    updated_at: new Date()
  }

  const result = await db.collection('generators').insertOne(newGenerator)
  return { _id: result.insertedId }
})