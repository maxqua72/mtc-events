// server/utils/shorty-token.ts
import { randomBytes } from 'node:crypto'

/**
 * Genera un token alfanumerico da 6 caratteri con separatore (es: A1B-34C)
 */
export const generateShortToken = () => {
  const hex = randomBytes(3).toString('hex').toUpperCase()
  return hex //`${hex.slice(0, 3)}-${hex.slice(3)}`
}

export const showToken = (hex: string) => {
    return`${hex.slice(0, 3)}-${hex.slice(3)}`
}

/**
 * Genera un token unico verificando la sua esistenza nel database
 */
export const generateUniqueShortToken = async (db: any) => {
  let shortToken = ''
  let isUnique = false
  let attempts = 0

  while (!isUnique && attempts < 10) {
    shortToken = generateShortToken()
    // Verifichiamo l'esistenza nella collezione memberships
    const existing = await db.collection('memberships').findOne({ short_token: shortToken })
    if (!existing) {
      isUnique = true
    }
    attempts++
  }

  if (!isUnique) {
    throw createError({ 
      statusCode: 500, 
      statusMessage: 'Errore critico: Impossibile generare un token unico dopo 10 tentativi.' 
    })
  }

  return shortToken
}