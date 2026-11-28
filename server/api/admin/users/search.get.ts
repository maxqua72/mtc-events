// server/api/admin/users/search.get.ts
import { defineEventHandler, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const db = await getDb() // Deve stare DENTRO
    const { email } = getQuery(event)

    if (!email) return null

    // Solo i campi che servono al form (niente credenziali, token FCM, ecc.)
    const user = await db.collection('users').findOne(
      { email: email.toString().toLowerCase().trim() },
      { projection: { _id: 1, email: 1, name: 1, surname: 1 } }
    )

    return user || null
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Errore interno del database'
    })
  }
})