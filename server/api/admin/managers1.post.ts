// server/api/admin/managers.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, association_id } = body
  const db = await getDb()

  // 1. Trova o crea l'utente nella collezione users
  let user = await db.collection('users').findOne({ email })
  
  if (!user) {
    const newUser = await db.collection('users').insertOne({
      email,
      name: email.split('@')[0], // Nome provvisorio dall'email
      is_admin: false,
      created_at: new Date()
    })
    user = { _id: newUser.insertedId, email }
  }

  // 2. Verifica se è già manager di questa ASD per evitare duplicati
  const existing = await db.collection('managers').findOne({
    user_id: user._id,
    association_id: new Object(association_id)
  })

  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Questo utente è già manager di questa associazione'
    })
  }

  // 3. Crea il legame nella collezione managers
  await db.collection('managers').insertOne({
    user_id: user._id,
    association_id: new Object(association_id),
    role: 'MANAGER',
    assigned_at: new Date()
  })

  return { success: true, message: 'Manager assegnato correttamente' }
})