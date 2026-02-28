// server/api/manager/[slug]/events.get.ts
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const db = await getDb()

  const asd = await db.collection('associations').findOne({ slug })
  if (!asd) return []

  // Restituisce gli eventi futuri o recenti dell'ASD
  return await db.collection('events')
    .find({ association_id: asd._id })
    .sort({ start_date: 1 })
    .toArray()
})