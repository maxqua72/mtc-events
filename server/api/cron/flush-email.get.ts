// server/api/cron/flush-email.get.ts
// Invia le email rimaste in coda (task email/flush). Richiede CRON_SECRET.
export default defineEventHandler(async (event) => {
  requireCronSecret(event)

  try {
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
