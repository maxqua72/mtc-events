// server/api/manager/[slug]/events/index.post.ts
import { ObjectId } from 'mongodb'
export default defineEventHandler(async (event) => {
  const db = await getDb()
  const body = await readBody(event)
  const slug = getRouterParam(event, 'slug')

  // Recuperiamo l'ASD per avere l'association_id
  const asd = await db.collection('associations').findOne({ slug })
  if (!asd) throw createError({ statusCode: 404, message: 'ASD non trovata' })

  // --- LOGICA DI CONVERSIONE ---
  // Funzione utility per convertire stringhe ISO in oggetti Date validi
  const toDate = (dateStr: string) => {
    if (!dateStr) return null
    const d = new Date(dateStr)
    return isNaN(d.getTime()) ? null : d
  }
  
  const newEvent = {
    ...body,
    // Sovrascriviamo i campi stringa trasformandoli in oggetti Date
    start_date: toDate(body.start_date),
    end_date: toDate(body.end_date),
    registration_time: toDate(body.registration_time),
    association_id: new ObjectId(asd._id),
    created_at: new Date(),
    updated_at: new Date()
  }

  const result = await db.collection('events').insertOne(newEvent)
  return { _id: result.insertedId }
})