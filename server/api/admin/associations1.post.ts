// server/api/admin/associations.post.ts
export default defineEventHandler(async (event) => {
  // 1. Protezione: solo un Admin può creare ASD (implementazione base)
  // In produzione qui controlleremo il token/sessione per verificare user.is_admin
  
  const body = await readBody(event)
  const { name, slug, theme_color } = body
  const db = await getDb()

  // 2. Validazione minima
  if (!name || !slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nome e Slug sono obbligatori',
    })
  }

  // 3. Verifica unicità dello slug
  const existingAsd = await db.collection('associations').findOne({ slug })
  if (existingAsd) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Questo slug è già in uso da un\'altra associazione',
    })
  }

  // 4. Creazione del documento
  const newAsd = {
    name,
    slug: slug.toLowerCase().trim().replace(/\s+/g, '-'), // Pulizia dello slug
    theme_color: theme_color || '#3b82f6',
    created_at: new Date()
  }

  const result = await db.collection('associations').insertOne(newAsd)

  return {
    success: true,
    message: 'Associazione creata con successo',
    asd_id: result.insertedId
  }
})