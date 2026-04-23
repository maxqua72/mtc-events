// server/utils/shorty-token.ts
import { randomBytes } from 'node:crypto'

/**
 * Genera un token alfanumerico da 6 caratteri con separatore (es: A1B-34C)
 */
export const generateManagerToken = () => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ' // Alfabeto leggibile senza 0, 1, I, O
  let result = ''
  for (let i = 0; i < 9; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const showManagerToken = (token: string) => {
  if (!token) return ''
  
  // Rimuoviamo eventuali trattini o spazi esistenti per evitare doppi spazi
  const cleanToken = token.replace(/[-\s]/g, '')

  // Se non è lungo 9, restituiamo l'originale (o il pulito)
  if (cleanToken.length !== 9) return token

  // Formattiamo in blocchi da 3
  const parts = cleanToken.match(/.{1,3}/g)
  
  return parts ? parts.join('-') : cleanToken
}

/**
 * Genera un token unico verificando la sua esistenza nel database
 */
export const generateUniqueManagerToken = async (db: any) => {
  let token = ''
  let isUnique = false
  let attempts = 0

  while (!isUnique && attempts < 10) {
    token = generateManagerToken()
    // Verifichiamo l'esistenza nella collezione managers
    const existing = await db.collection('managers').findOne({ manager_token: token })
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

  return token
}