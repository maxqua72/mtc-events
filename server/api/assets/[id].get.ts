import { GridFSBucket, ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || !ObjectId.isValid(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID non valido' })
  }

  const db = await getDb()
  const bucket = new GridFSBucket(db, { bucketName: 'resources' })

  // 1. Troviamo il file per recuperare il Content-Type dai metadati
  const files = await db.collection('resources.files').find({ _id: new ObjectId(id) }).toArray()
  if (!files.length) throw createError({ statusCode: 404, statusMessage: 'File non trovato' })
  
  const file = files[0] as any

  // 2. Impostiamo gli Header per il browser (Tipo di file e Cache)
  setHeaders(event, {
    'Content-Type': file.metadata?.contentType || 'application/octet-stream',
    'Cache-Control': 'public, max-age=31536000, immutable', // Cache di 1 anno
  })

  // 3. Restituiamo lo stream direttamente dal database
  return sendStream(event, bucket.openDownloadStream(new ObjectId(id)))
})