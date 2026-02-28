import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  const db = await getDb()
  const { slug, id } = event.context.params
  
  // 1. Leggiamo eventuali filtri o date dal body/query
  const body = await readBody(event).catch(() => ({}))
  const query = getQuery(event)
  
  // Se c'è un ID nell'URL, gestiamo il rolling SINGOLO MANUALE
  if (id) {
    const generator = await db.collection('generators').findOne({ 
      _id: new ObjectId(id),
      asd_slug: slug 
    })

    if (!generator) {
      throw createError({ statusCode: 404, message: 'Generatore non trovato' })
    }

    // Per il manuale usiamo la target_date passata dal calendario
    const targetDate = body.target_date ? new Date(body.target_date) : new Date()
    const result = await executeRolling(db, generator, targetDate)

    return { 
      success: true, 
      generated_count: result.count,
      last_date: result.last_date 
    }
  }

  // 2. Se NON c'è ID, gestiamo il rolling di GRUPPO (Filtrato o Globale)
  const category = query.category as string
  const filter: any = { asd_slug: slug }
  
  if (category && category !== 'tutti') {
    filter.category = category.toLowerCase()
  }

  const generators = await db.collection('generators').find(filter).toArray()
  
  let totalGenerated = 0
  const processedGenerators = []

  for (const gen of generators) {
    // Per il rolling automatico/globale usiamo i rolling_days definiti nella matrice
    const daysToCover = gen.recurrence?.rolling_days || 7
    const autoTargetDate = new Date()
    autoTargetDate.setDate(autoTargetDate.getDate() + daysToCover)

    const result = await executeRolling(db, gen, autoTargetDate)
    
    if (result.count > 0) {
      totalGenerated += result.count
      processedGenerators.push({ id: gen._id, count: result.count })
    }
  }

  return { 
    success: true, 
    total_generated: totalGenerated,
    generators_updated: processedGenerators.length,
    scope: category || 'all'
  }
})