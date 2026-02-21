// server/api/asd/[slug]/sync-status.get.ts
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const db = await getDb()
  
  // Per ora identifichiamo l'utente tramite email (che lo store invierà nell'header o query)
  // In una fase successiva useremo i JWT per massima sicurezza
  const email = getHeader(event, 'x-user-email') 

  const membership = await db.collection('memberships').findOne({
    email: email?.toLowerCase(),
    association_id: (await db.collection('associations').findOne({ slug }))?._id,
  })

  if (!membership || membership.status !== 'active') {
    return { active: false }
  }

  return {
    active: true,
    profile: {
      name: membership.name,
      email: membership.email,
      expiry_date: membership.expiry_date,
      role: 'MEMBER'
    }
  }
})