import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  const db = await getDb()
  const slug = getRouterParam(event, 'slug')
  const query = getQuery(event)
  const categoryFilter = query.category

  // 1. Recuperiamo l'ASD (Verifichiamo che esista)
  const asd = await db.collection('associations').findOne({ slug })
  if (!asd) throw createError({ statusCode: 404, message: 'ASD non trovata' })

  // 2. Prepariamo il filtro
  const searchFilter = {
    association_id: asd._id,
    status: 'active',
    // Qui applichiamo is_published perché questo è un rolling batch (multiplo)
    is_published: true 
  }
  
  // Se l'utente ha filtrato per categoria (es. "torneo")
  if (categoryFilter && categoryFilter !== 'all') {
    searchFilter.category = categoryFilter.toLowerCase()
  }

  const generators = await db.collection('generators').find(searchFilter).toArray()
  let totalCreated = 0

  for (const gen of generators) {
    // Definiamo il target: copriamo i giorni previsti (es. 30) a partire da oggi
    const daysToCover = gen.recurrence?.rolling_days || 30
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + daysToCover)

    // USIAMO LA UTILITY (che gestisce duplicati, date e aggiornamento matrice)
    const result = await executeRolling(db, gen, targetDate)
    totalCreated += result.count
  }

  return { 
    success: true, 
    message: `Generazione completata. Creati ${totalCreated} nuovi eventi.` 
  }
})