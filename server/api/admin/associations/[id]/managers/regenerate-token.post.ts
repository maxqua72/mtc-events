import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  const asdId = getRouterParam(event, 'id')
  const body = await readBody(event)
  const email = body.email?.toLowerCase().trim()
  
  const db = await getDb()

  if (!asdId || !email) {
    throw createError({ 
      statusCode: 400, 
      statusMessage: 'Parametri mancanti (ID ASD o Email)' 
    })
  }

  // 1. Troviamo l'utente manager tramite email
  const user = await db.collection('users').findOne({ email })
  if (!user) {
    throw createError({ 
      statusCode: 404, 
      statusMessage: 'Utente non trovato' 
    })
  }

  // 2. Generiamo un nuovo token unico a 9 caratteri usando la nostra utility
  // Nota: generateUniqueManagerToken interroga già db.collection('managers')
  const newToken = await generateUniqueManagerToken(db)

  // 3. Aggiorniamo il token nella collezione 'managers'
  // Filtriamo per user_id e association_id per sicurezza
  const result = await db.collection('managers').updateOne(
    { 
      user_id: user._id, 
      association_id: new ObjectId(asdId) 
    },
    { 
      $set: { 
        manager_token: newToken,
        updated_at: new Date() 
      } 
    }
  )

  if (result.matchedCount === 0) {
    throw createError({ 
      statusCode: 404, 
      statusMessage: 'Relazione Manager-ASD non trovata' 
    })
  }

  return { 
    success: true, 
    manager_token: newToken 
  }
})