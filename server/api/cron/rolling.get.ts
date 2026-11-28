// server/api/cron/rolling.get.ts
// Genera le occorrenze future degli eventi ricorrenti (task generators/rolling).
// Accetta solo chiamate dalla macchina stessa e con CRON_SECRET.
export default defineEventHandler(async (event) => {
  // L'indirizzo è quello del socket: X-Forwarded-For non conta, perché si può falsificare
  if (!isLocalConnection(event)) {
    throw createError({ statusCode: 403, message: 'Accesso consentito solo localmente' })
  }

  requireCronSecret(event)

  const result = await runTask('generators/rolling')

  return {
    success: true,
    timestamp: new Date().toISOString(),
    result
  }
})
