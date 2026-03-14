// server/api/asd/[slug]/sync-fcm-token.post.ts

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const db = await getDb()
  const body = await readBody(event)
  const { email, token } = body

  if (!email || !token) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email e Token sono obbligatori'
    })
  }

  // 1. Recuperiamo l'ID dell'associazione tramite lo slug
  const association = await db.collection('associations').findOne({ slug })
  if (!association) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Associazione non trovata'
    })
  }

  const normalizedEmail = email.toLowerCase()

  // 2. Tentiamo l'aggiornamento sulla collezione memberships (SOCIO)
  // Usiamo $addToSet per evitare duplicati nell'array fcm_tokens
  const memberResult = await db.collection('memberships').updateOne(
    { 
      email: normalizedEmail, 
      association_id: association._id 
    },
    { 
      $addToSet: { fcm_tokens: token },
      $set: { updated_at: new Date() } 
    }
  )

  // 3. Se non è un socio, verifichiamo se è un MANAGER (o Admin)
  // Questo assicura che anche chi gestisce l'app possa ricevere notifiche
  if (memberResult.matchedCount === 0) {
    await db.collection('users').updateOne(
      { email: normalizedEmail },
      { 
        $addToSet: { fcm_tokens: token },
        $set: { updated_at: new Date() }
      }
    )
    
    return { 
      success: true, 
      target: 'manager',
      message: 'Token sincronizzato nel profilo utente/manager' 
    }
  }

  return { 
    success: true, 
    target: 'member',
    message: 'Token sincronizzato nella membership del socio' 
  }
})