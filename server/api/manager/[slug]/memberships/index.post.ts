// server/api/manager/[slug]/memberships.post.ts
import { ObjectId } from 'mongodb'
import { randomUUID, randomBytes } from 'node:crypto'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const body = await readBody(event)
  const db = await getDb()

  const asd = await db.collection('associations').findOne({ slug })
  if (!asd) {
    throw createError({ statusCode: 404, statusMessage: 'ASD non trovata' })
  }

  // Se passiamo un _id nel body, stiamo facendo un EDIT, altrimenti un INSERT
  const isEdit = !!body._id
  const filter = isEdit 
    ? { _id: new ObjectId(body._id) } 
    : { email: body.email.toLowerCase().trim(), association_id: asd._id };

  const finalMemberCode = body.member_code || `TESS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Dati che vengono sempre aggiornati (o impostati)
  const updateData = {
    name: body.name,
    surname: body.surname,
    email: body.email?.toLowerCase().trim(),
    member_code: finalMemberCode,
    start_date: new Date(body.start_date),
    expiry_date: new Date(body.expiry_date),
    status: body.status || 'active',
    updated_at: new Date()
  }

  // Dati impostati SOLO in caso di nuova creazione (INSERT)
  const insertData = {
    association_id: asd._id,
    // Generiamo il token univoco per il futuro link di join
    join_token: randomUUID(),
    // Fallback per il codice tessera se non fornito
    fcm_tokens: [],
    created_at: new Date()
  }

  // GESTIONE TOKEN CORTO (Solo se è un nuovo inserimento)
  if (!isEdit) {
    insertData.short_token = await generateUniqueShortToken(db)
  }

  const result = await db.collection('memberships').updateOne(
    filter,
    {
      $set: updateData,
      $setOnInsert: insertData
    },
    { upsert: true }
  )

  return { success: true, 
    id: body._id || result.upsertedId, 
    short_token: insertData.short_token // Lo restituiamo per eventuale feedback
  }
})