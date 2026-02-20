// server/api/manager/[slug]/memberships.post.ts
import { ObjectId } from 'mongodb'
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const body = await readBody(event)
  const db = await getDb()

  const asd = await db.collection('associations').findOne({ slug })
  if (!asd) {
    throw createError({ statusCode: 404, statusMessage: 'ASD non trovata' })
  }

  // Se passiamo un _id nel body, stiamo facendo un EDIT, altrimenti un INSERT
  const filter = body._id 
    ? { _id: new ObjectId(body._id) } 
    : { email: body.email.toLowerCase().trim(), association_id: asd._id };

  const updateData = {
    name: body.name,
    email: body.email?.toLowerCase().trim(),
    start_date: new Date(body.start_date),
    expiry_date: new Date(body.expiry_date),
    status: body.status || 'active',
    updated_at: new Date()
  }

  const result = await db.collection('memberships').updateOne(
    filter,
    {
      $set: updateData,
      $setOnInsert: {
        association_id: asd._id,
        member_code: body.member_code || `TESS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        fcm_tokens: [],
        created_at: new Date()
      }
    },
    { upsert: true }
  )

  return { success: true }
})