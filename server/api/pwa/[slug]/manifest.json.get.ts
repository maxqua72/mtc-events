// server/api/pwa/[slug]/manifest.json.get.ts

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const db = await getDb()
  
  // Qui dovresti chiamare il tuo database MongoDB
  const asd = await db.collection('associations').findOne({ slug: slug })

  if (!asd) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Associazione non trovata',
    })
  }

  // 3. Costruisco l'array di icone in base a ciò che è presente nel DB
  // Usiamo dei fallback (opzionali) se un'icona specifica mancasse
  const icons = []

  if (asd.icon_192_url) {
    icons.push({
      src: asd.icon_192_url,
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any' 
    })
    // Aggiungiamo anche la versione "maskable" (opzionale, ma consigliata per Android)
    icons.push({
      src: asd.icon_192_url,
      sizes: '192x192',
      type: 'image/png',
      purpose: 'maskable'
    })
  }

  if (asd.icon_512_url) {
    icons.push({
      src: asd.icon_512_url,
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any'
    })
  }
  
  

  return {
    id: `/${slug}/`,
    name: asd.name,
    short_name: asd.name.substring(0, 12),
    theme_color: asd.theme_color ||'#1a1a1a',
    background_color: '#1a1a1a',
    display: 'standalone',
    scope: `/${slug}/`,
    start_url: `/${slug}/events?mode=pwa`,
    icons: icons,
    screenshots: [
      {
        src: '/screenshot-mobile.png',
        sizes: '1170x2532', // Valore esatto segnalato da Chrome
        type: 'image/png',
        label: `${asd.name} mobile`
      },
      {
        src: '/screenshot-desktop.png',
        sizes: '1280x720', // Valore esatto segnalato da Chrome
        type: 'image/png',
        form_factor: 'wide',
        label: `${asd.name} desktop`
      }
    ],
  }
})