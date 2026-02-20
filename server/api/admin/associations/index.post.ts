// server/api/admin/associations/index.post.ts
export default defineEventHandler(async (event) => {
  const db = await getDb()
  const body = await readBody(event)

  if (!body.name || !body.slug) {
    throw createError({ statusCode: 400, statusMessage: 'Nome e Slug sono obbligatori' })
  }

  // Normalizzazione slug (minuscolo, senza spazi)
  const cleanSlug = body.slug.toLowerCase().trim().replace(/\s+/g, '-')

  // Verifica unicità dello slug
  const existing = await db.collection('associations').findOne({ slug: cleanSlug })
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Questo slug è già utilizzato' })
  }

  const newAsd = {
    name: body.name,
    slug: cleanSlug,
    theme_color: body.theme_color || '#3b82f6',
    logo_url: body.logo_url || null, // L'URL dell'immagine caricata in GridFS
    created_at: new Date(),
    updated_at: new Date()
  }

  const result = await db.collection('associations').insertOne(newAsd)

  return { 
    ...newAsd, 
    _id: result.insertedId 
  }
})