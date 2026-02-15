export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Slug mancante' })

  const db = await getDb()

  // 1. Identifichiamo l'ASD tramite lo slug
  const asd = await db.collection('associations').findOne({ slug })
  if (!asd) throw createError({ statusCode: 404, statusMessage: 'ASD non trovata' })

  // 2. Interroghiamo la collezione dei metadati di GridFS
  // Specifichiamo 'as any[]' o usiamo una mappatura tipizzata per risolvere il problema di VSC
  const files = await db.collection('resources.files')
    .find({ 
        "metadata.association_id": asd._id,
        'metadata.is_event_private': { $ne: true } // Esclude le immagini caricate da file nell'evento
     })
    .sort({ uploadDate: -1 })
    .toArray() as any[]

  // 3. Mappiamo i dati per il frontend
  // Ora 'file' non è più "implicitly any" perché abbiamo dichiarato files come array
  return files.map((file) => ({
    _id: file._id,
    // Usiamo il nome scelto dal MANAGER, altrimenti il nome originale del file
    name: file.metadata?.displayName || file.filename,
    url: `/api/assets/${file._id}`,
    // Determiniamo l'icona da mostrare nel frontend
    type: file.metadata?.contentType?.includes('pdf') ? 'pdf' : 'image',
    // Convertiamo i byte in KB leggibili
    size: (file.length / 1024).toFixed(2) + ' KB',
    uploadDate: file.uploadDate
  }))
})