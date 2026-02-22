import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  const db = await getDb()
  const body = await readBody(event)
  const slug = getRouterParam(event, 'slug')
  const { eventIds } = body

  // 1. Validazione input
  if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
    throw createError({ statusCode: 400, message: 'Nessun ID evento fornito' })
  }

  // 2. Recuperiamo l'ASD per avere l'association_id (sicurezza)
  const asd = await db.collection('associations').findOne({ slug })
  if (!asd) throw createError({ statusCode: 404, message: 'ASD non trovata' })

  // 3. Convertiamo gli ID stringa in ObjectId di MongoDB
  const objectIds = eventIds.map(id => new ObjectId(id))

  try {
    // 4. Aggiornamento massivo
    // Filtriamo per ID e per association_id per garantire la proprietà dei dati
    const result = await db.collection('events').updateMany(
      { 
        _id: { $in: objectIds }, 
        association_id: asd._id 
      },
      { 
        $set: { 
          is_published: true,
          updated_at: new Date() 
        } 
      }
    )

    return { 
      success: true, 
      modifiedCount: result.modifiedCount,
      message: `Pubblicazione completata: ${result.modifiedCount} eventi aggiornati.`
    }
  } catch (error) {
    throw createError({ 
      statusCode: 500, 
      message: 'Errore durante l\'aggiornamento massivo degli eventi' 
    })
  }
})