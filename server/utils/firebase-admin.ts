import admin from 'firebase-admin'

// In Nuxt 4, usiamo runtimeConfig invece di process.env direttamente 
// per una migliore integrazione
//const config = useRuntimeConfig()

if (!admin.apps.length) {
  try {
    // Nota: assicurati che la variabile sia definita nel nuxt.config 
    // sotto 'runtimeConfig' (non public) o recuperala così:
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}')

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    })
    console.log('[FIREBASE ADMIN] ✅ Inizializzato correttamente')
  } catch (error) {
    console.error('[FIREBASE ADMIN] ❌ Errore:', error)
  }
}
export const fbMessaging = admin.messaging()
export const fbAdmin = admin