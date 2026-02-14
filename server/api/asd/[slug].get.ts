export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const db = await getDb()
  
  // Cerchiamo l'associazione per slug
  const asd = await db.collection('associations').findOne({ slug: slug })

  if (!asd) {
    throw createError({
      statusCode: 404,
      statusMessage: `ASD con slug ${slug} non trovata`,
    })
  }

  return asd
})