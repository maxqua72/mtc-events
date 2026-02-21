import { ObjectId } from 'mongodb'
import { randomUUID } from 'node:crypto'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const id = getRouterParam(event, 'id')
  const db = await getDb()

  // 1. Verifica che l'ASD esista
  const asd = await db.collection('associations').findOne({ slug })
  if (!asd) {
    throw createError({ statusCode: 404, statusMessage: 'ASD non trovata' })
  }

  // 2. Genera un nuovo UUID
  const newToken = randomUUID()

  // 3. Aggiorna la membership specifica
  // Verifichiamo anche l'association_id per sicurezza extra (cross-tenant security)
  const result = await db.collection('memberships').updateOne(
    { 
      _id: new ObjectId(id),
      association_id: asd._id 
    },
    { 
      $set: { 
        join_token: newToken,
        updated_at: new Date()
      } 
    }
  )

  if (result.matchedCount === 0) {
    throw createError({ 
      statusCode: 404, 
      statusMessage: 'Socio non trovato o non appartenente a questa associazione' 
    })
  }

  return { 
    success: true, 
    new_token: newToken 
  }
})