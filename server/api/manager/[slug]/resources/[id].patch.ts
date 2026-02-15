import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!slug || !id || !ObjectId.isValid(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Parametri non validi' })
  }

  const db = await getDb()
  const asd = await db.collection('associations').findOne({ slug })
  if (!asd) throw createError({ statusCode: 404 })

  // 1. Eseguiamo l'aggiornamento con filtro di sicurezza sulla proprietà
  // Usiamo $set per cambiare solo il displayName dentro l'oggetto metadata
  const result = await db.collection('resources.files').updateOne(
    { 
      _id: new ObjectId(id),
      "metadata.association_id": asd._id 
    },
    { 
      $set: { "metadata.displayName": body.name } 
    }
  )

  if (result.matchedCount === 0) {
    throw createError({ 
      statusCode: 403, 
      statusMessage: 'Risorsa non trovata o permessi insufficienti' 
    })
  }

  return { success: true }
})