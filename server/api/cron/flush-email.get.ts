// server/api/cron/flush-email.get.ts
//import { defineEventHandler, createError } from 'h3'

export default defineEventHandler(async (event) => {
  // 1. Recuperiamo il Bearer token dall'header di Authorization
  const authHeader = getHeader(event, 'authorization')
  
  // 2. Recuperiamo il segreto definito nelle variabili d'ambiente del server
  const config = useRuntimeConfig()
  const cronSecret = process.env.CRON_SECRET || config.cronSecret

  // 3. Validazione del token per impedire accessi esterni non autorizzati
  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Invalid or missing Cron Secret Token'
    })
  }

  try {
    // 4. Invochiamo il task compilato usando la chiave registrata
    const taskResult = await runTask('email/flush')
    
    return {
      success: true,
      timestamp: new Date().toISOString(),
      result: taskResult
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Server Error',
      message: error.message || 'Errore durante lo scodamento delle email'
    })
  }
})