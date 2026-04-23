import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  const db = await getDb()
  const body = await readBody(event)
  const { oldEmail, newEmail, name } = body

  // 1. Troviamo l'utente (Manager) tramite la vecchia email
  const user = await db.collection('users').findOne({ email: oldEmail })
  
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Manager non trovato' })
  }

  // 2. Controllo collisioni se l'email cambia
  if (newEmail !== oldEmail) {
    const emailExists = await db.collection('users').findOne({ email: newEmail.toLowerCase().trim() })
    if (emailExists) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: 'La nuova email è già assegnata a un altro utente di sistema' 
      })
    }
  }

  // 3. Aggiorniamo SOLO la collezione users
  // Non tocchiamo memberships: l'identità "socio" rimane separata.
  await db.collection('users').updateOne(
    { _id: user._id },
    { 
      $set: { 
        email: newEmail.toLowerCase().trim(),
        name: name.trim()
      } 
    }
  )

  return { success: true }
})