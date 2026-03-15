
export default defineEventHandler(async (event) => {
  const { slug } = event.context.params
  const body = await readBody(event)
  const { email, title, body: messageBody } = body

  // 1. Determiniamo il dominio base per trasformare il percorso relativo in assoluto
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const host = getRequestHost(event) // Helper di H3 per ottenere il dominio corrente
  const baseUrl = `${protocol}://${host}`

  console.log('Base URL determinato:', baseUrl)

  const db = await getDb()

  // 2. Recuperiamo l'ASD per il logo
  const asd = await db.collection('associations').findOne({ slug: slug })

  // 3. Costruiamo l'URL assoluto del logo
  let asdLogo = `${baseUrl}/favicon.ico` // Fallback
  if (asd?.logo_url) {
    // Se inizia con / lo incolliamo al baseUrl, altrimenti lo usiamo così com'è
    asdLogo = asd.logo_url.startsWith('http') 
      ? asd.logo_url 
      : `${baseUrl}${asd.logo_url}`
  }
  //asdLogo = 'https://cdn-icons-png.flaticon.com/512/190/190411.png'
  console.log('ASD Logo URL:', asdLogo)

  // 1. Recuperiamo la membership per avere i token
  const membership = await db.collection('memberships').findOne({ 
    email: email.toLowerCase(),
    association_id: asd._id
  })

  if (!membership || !membership.fcm_tokens || membership.fcm_tokens.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Nessun token push trovato per questo utente'
    })
  }

  // 2. Prepariamo il messaggio per Firebase
  // Inviamo a tutti i token registrati (es. telefono e desktop)
  const messages = membership.fcm_tokens.map(token => ({
    token,
    notification: {
      title: title || 'Notifica ASD',
      body: messageBody || 'Messaggio di test',
    },
    // CONFIGURAZIONE SPECIFICA PER WEB (Browser)
    webpush: {
        notification: {
            icon: asdLogo,      // Qui è dove Firebase Admin cerca l'icona per i browser
            badge: asdLogo,     // L'iconcina nella barra di stato (Android)
            requireInteraction: true // Opzionale: la notifica non sparisce finché non clicchi
        },
        fcmOptions: {
            link: `${baseUrl}/${slug}/events` // URL dove andare al click (gestito nativamente da FCM)
        }
    },
    // Dati extra utili per la logica dell'app
    data: {
      asd_slug: slug,
      asd_logo: asdLogo, // URL assoluto necessario qui per il plugin
      click_action: `/${slug}/events` 
    }
  }))

  try {
    console.log('Tipo di fbAdmin:', typeof fbAdmin)
    console.log('Funzioni disponibili:', Object.keys(fbAdmin))
    //const messaging = fbAdmin.messaging()
    // Invio massivo (multicast)
    //const response = await fbAdmin.messaging().sendEach(messages)
    const response = await fbMessaging.sendEach(messages)

    console.log('Risposta invio FCM:', response)
    if(response.responses[0].error){
        console.log('Dettaglio Errore FCM:', JSON.stringify(response.responses[0].error, null, 2))
    }
    
    
    return { 
      success: true, 
      sentCount: response.successCount, 
      failureCount: response.failureCount 
    }
  } catch (error) {
    console.error('Errore invio FCM:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Errore durante l\'invio della notifica'
    })
  }
})