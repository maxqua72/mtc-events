import { GridFSBucket, ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const id = getRouterParam(event, 'id')

  if (!slug || !id || !ObjectId.isValid(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Parametri non validi' })
  }

  const db = await getDb()
  const asd = await db.collection('associations').findOne({ slug })
  if (!asd) throw createError({ statusCode: 404 })

  // 1. VERIFICA PROPRIETÀ: Cerchiamo il file nel DB verificando che l'ASD sia corretta
  const file = await db.collection('resources.files').findOne({ 
    _id: new ObjectId(id),
    "metadata.association_id": asd._id 
  })

  if (!file) {
    throw createError({ 
      statusCode: 403, 
      statusMessage: 'Non hai i permessi per eliminare questa risorsa o il file non esiste' 
    })
  }

  // 2. ESECUZIONE ELIMINAZIONE
  const bucket = new GridFSBucket(db, { bucketName: 'resources' })
  
  // bucket.delete rimuove sia il record in .files che tutti i blocchi in .chunks
  await bucket.delete(new ObjectId(id))

  return { success: true }
})