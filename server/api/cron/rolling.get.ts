// server/api/cron/rolling.get.ts
export default defineEventHandler(async (event) => {
    //Accetta la chiamata solo se arriva dall'interno (localhost)
    const clientAddress = getRequestIP(event, { xForwardedFor: true })
  
  // Se la chiamata non viene da 127.0.0.1 (localhost), la blocchiamo a prescindere dalla chiave
  const isLocal = clientAddress === '127.0.0.1' || clientAddress === '::1'
  
  if (!isLocal) {
    throw createError({ statusCode: 403, message: 'Accesso consentito solo localmente' })
  }

  // Controllo di sicurezza: una chiave segreta passata nell'header o come query
  const config = useRuntimeConfig()
  const authHeader = getHeader(event, 'Authorization')
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    throw createError({ statusCode: 401, message: 'Non autorizzato' })
  }

  // Eseguiamo il task Nitro internamente
  const result = await runTask('generators/rolling')
  
  return { 
    success: true, 
    timestamp: new Date().toISOString(),
    result 
  }
})