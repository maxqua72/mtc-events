import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  const asdId = getRouterParam(event, 'id')
  const db = await getDb()
  const body = await readBody(event)
  const email = body.email?.toLowerCase().trim()

  if (!asdId || asdId === 'undefined') {
    throw createError({ statusCode: 400, statusMessage: 'ID ASD mancante o non valido' })
  }

  // 1. Cerchiamo l'utente o lo creiamo se nuovo
  let user = await db.collection('users').findOne({ email })

  if (!user) {
    // Se l'utente non esiste, lo creiamo usando il nome passato dal modal
    const result = await db.collection('users').insertOne({
      email,
      name: body.name || 'Nuovo Utente', // Fallback se il nome mancasse
      created_at: new Date(),
      is_admin: false // Default per i nuovi MANAGER
    })
    user = { _id: result.insertedId }
  }

  // 2. Creiamo o aggiorniamo il legame nella collezione 'managers'
  // Usiamo MANAGER (maiuscolo) come da tue specifiche
  await db.collection('managers').updateOne(
    { 
      user_id: new ObjectId(user._id), 
      association_id: new ObjectId(asdId) 
    },
    { 
      $set: { 
        role: 'MANAGER', 
        assigned_at: new Date() 
      } 
    },
    { upsert: true }
  )

  return { success: true }
})