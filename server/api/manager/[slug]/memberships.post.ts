// server/api/manager/[slug]/memberships.post.ts
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const body = await readBody(event)
  const { email, name, expiry_date } = body
  const db = await getDb()

  // 1. Troviamo l'ASD per assicurarci che lo slug sia valido e avere l'ID
  const asd = await db.collection('associations').findOne({ slug })
  if (!asd) {
    throw createError({ statusCode: 404, statusMessage: 'Associazione non trovata' })
  }

  if (!email || !expiry_date) {
    throw createError({ statusCode: 400, statusMessage: 'Email e Scadenza obbligatorie' })
  }

  // 2. Operazione sulla collezione MEMBERSHIPS
  const result = await db.collection('memberships').updateOne(
    { 
      email: email.toLowerCase().trim(), 
      association_id: asd._id 
    },
    {
      $set: {
        name,
        start_date: new Date(),
        expiry_date: new Date(expiry_date),
        status: 'active',
        updated_at: new Date()
      },
      $setOnInsert: {
        member_code: `TESS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        fcm_tokens: [] 
      }
    },
    { upsert: true }
  )

  return { 
    success: true, 
    message: result.upsertedCount > 0 ? 'Socio creato' : 'Socio aggiornato' 
  }
})