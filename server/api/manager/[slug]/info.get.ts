export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const db = await getDb()
  return await db.collection('associations').findOne({ slug })
})