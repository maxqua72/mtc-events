import { GridFSBucket, ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
    const slug = getRouterParam(event, 'slug')

    // 1. Verifica validità slug
    if (!slug) {
        throw createError({ statusCode: 400, statusMessage: 'Slug mancante' })
    }

    const db = await getDb()

    // 2. Recupera l'ASD per ottenere il suo _id (vincolo di proprietà)
    const asd = await db.collection('associations').findOne({ slug })
    if (!asd) {
        throw createError({ statusCode: 404, statusMessage: 'ASD non trovata' })
    }

    // 3. Legge i dati dal form (file + nome scelto dal manager)
    const formData = await readMultipartFormData(event)
    if (!formData) {
        throw createError({ statusCode: 400, statusMessage: 'Nessun dato ricevuto' })
    }

    const fileField = formData.find(f => f.name === 'file')
    const nameField = formData.find(f => f.name === 'name')

    if (!fileField || !fileField.data || !fileField.filename) {
        throw createError({ statusCode: 400, statusMessage: 'File non valido' })
    }

    const privateField = formData.find(f => f.name === 'is_event_private')
    const isPrivate = privateField?.data?.toString() === 'true'

    // 4. Inizializza GridFS
    const bucket = new GridFSBucket(db, { bucketName: 'resources' })

    // 5. Prepara lo stream di caricamento con i METADATI di sicurezza
    // In GridFSBucketWriteStreamOptions, i metadati personalizzati 
    // vanno tutti dentro l'oggetto 'metadata'
    const uploadStream = bucket.openUploadStream(fileField.filename, {
        metadata: {
            displayName: nameField?.data?.toString() || fileField.filename,
            association_id: asd._id,
            contentType: fileField.type || 'application/octet-stream', // Salviamolo qui
            size: fileField.data.length,
            is_event_private: isPrivate
        }
    })

    // 6. Esegue il caricamento
    return new Promise((resolve, reject) => {
        uploadStream.on('finish', () => {
            resolve({
                _id: uploadStream.id,
                // Questo sarà l'URL che useremo per visualizzare l'immagine
                url: `/api/assets/${uploadStream.id}`,
                name: nameField?.data?.toString() || fileField.filename
            })
        })

        uploadStream.on('error', (err) => {
            reject(createError({ statusCode: 500, statusMessage: 'Errore durante il salvataggio nel DB' }))
        })

        uploadStream.end(fileField.data)
    })
})