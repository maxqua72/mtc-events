// server/api/legal/[type].get.ts

export default defineEventHandler(async (event) => {
  // 1. Recupera il database
  const db = await getDb()
  if (!db) {
    throw createError({ 
      statusCode: 500, 
      statusMessage: 'Database non disponibile' 
    })
  }

  // 2. Recupera il parametro dinamico [type] dalla rotta (es: privacy, cookies)
  const type = getRouterParam(event, 'type') 

  // 3. Cerca il documento attivo sul DB
  const doc = await db.collection('legal_documents').findOne({ type, is_active: true })
  
  if (!doc) {
    throw createError({ 
      statusCode: 404, 
      statusMessage: `Documento legale di tipo "${type}" non trovato o non ancora sincronizzato.` 
    })
  }

  // 4. Ritorna i dati formattati per il tuo LegalPreviewModal
  return {
    title: type === 'privacy' ? 'Privacy Policy' : type === 'cookies' ? 'Cookie Policy' : 'Termini e Condizioni',
    content: doc.content_html,
    fileUrl: doc.file_url
  }
})