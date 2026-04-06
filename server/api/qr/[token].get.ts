// server/api/qr/[token].get.ts
import QRCode from 'qrcode'

export default defineEventHandler(async (event) => {
  // 1. Recupero parametri
  const token = getRouterParam(event, 'token')
  const query = getQuery(event)
  const slug = query.slug as string

  if (!token || !slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Parametri mancanti (token o slug)'
    })
  }

  // 2. Costruzione link (quello che verrà scansionato)
  const config = useRuntimeConfig()
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const host = getRequestHost(event)
  const joinLink = `${protocol}://${host}/${slug}/join?t=${token}`

  try {
    // 3. Generazione QR as Buffer
    // Grazie a @types/qrcode, ora 'toBuffer' è riconosciuto correttamente
    const qrBuffer = await QRCode.toBuffer(joinLink, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 300,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })

    // 4. Invio risposta come immagine
    setResponseHeader(event, 'Content-Type', 'image/png')
    // Cache di una settimana per non sovraccaricare il server se l'utente riapre l'email
    setResponseHeader(event, 'Cache-Control', 'public, max-age=604800, immutable') 
    
    return qrBuffer
  } catch (err) {
    console.error('[QR_GEN_ERROR]', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Errore durante la creazione del QR Code'
    })
  }
})