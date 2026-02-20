// server/api/admin/associations/[id]/managers.delete.ts
import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  const asdId = getRouterParam(event, 'id')
  const query = getQuery(event)
  const userEmail = query.email as string

  const db = await getDb()

  if (!asdId || !ObjectId.isValid(asdId)) {
    throw createError({ statusCode: 400, statusMessage: 'ID ASD non valido' })
  }

  if (!userEmail) {
    throw createError({ statusCode: 400, statusMessage: 'Email manager necessaria per la rimozione' })
  }

  // 1. Troviamo l'utente tramite email
  const user = await db.collection('users').findOne({ email: userEmail.toLowerCase() })
  
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Utente non trovato' })
  }

  // 2. Rimuoviamo il record dalla collezione 'managers'
  const result = await db.collection('managers').deleteOne({
    user_id: new ObjectId(user._id),
    association_id: new ObjectId(asdId)
  })

  if (result.deletedCount === 0) {
    throw createError({ 
      statusCode: 404, 
      statusMessage: 'L\'utente non risulta essere un manager per questa associazione' 
    })
  }

  return { success: true, message: 'Ruolo manager revocato con successo' }
})