import { ObjectId } from "mongodb"

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const email = query.email?.toString().toLowerCase().trim()
  const asdId = query.asdId?.toString()

  // 1. Validazione parametri
  if (!email || !asdId) {
    throw createError({ 
      statusCode: 400, 
      statusMessage: 'Parametri email e asdId sono obbligatori' 
    })
  }

  // 2. Validazione formale dell'ObjectId
  if (!ObjectId.isValid(asdId)) {
    throw createError({ 
      statusCode: 400, 
      statusMessage: 'ID Associazione non valido' 
    })
  }

  const db = await getDb()

  try {
    // 3. Recupero Utente
    const user = await db.collection('users').findOne({ email })
    if (!user) {
      throw createError({ 
        statusCode: 404, 
        statusMessage: 'Utente non trovato nel sistema' 
      })
    }

    // 4. Recupero Relazione Manager
    const managerData = await db.collection('managers').findOne({
      user_id: user._id,
      association_id: new ObjectId(asdId)
    })

    // Restituiamo i dati dell'utente arricchiti dal token (se esiste)
    return {
      _id: user._id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      manager_token: managerData?.manager_token || null
    }

  } catch (error: any) {
    // Gestione errori MongoDB o di casting improvvisi
    throw createError({ 
      statusCode: error.statusCode || 500, 
      statusMessage: error.statusMessage || 'Errore interno del server' 
    })
  }
})