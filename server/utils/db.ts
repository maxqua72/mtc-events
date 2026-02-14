// server/utils/db.ts
import { MongoClient } from 'mongodb'

const config = useRuntimeConfig()
const client = new MongoClient(config.mongodbUri)

let db: any = null

export const getDb = async () => {
  if (db) return db
  try {
    await client.connect()
    db = client.db(config.mongoDbName || 'mtcevents')
    console.log('Successfully connected to MongoDB')
    return db
  } catch (e) {
    console.error('❌ Errore connessione DB:', e)
    throw e
  }
}