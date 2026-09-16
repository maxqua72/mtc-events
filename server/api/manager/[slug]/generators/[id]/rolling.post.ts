import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  const db = await getDb()
  //const { slug, id } = event.context.params
  // Otteniamo i parametri in modo type-safe
  const params = getRouterParams(event)
  const slug = params.slug
  const id = params.id
  
  // 1. Leggiamo eventuali filtri o date dal body/query
  const body = await readBody(event).catch(() => ({}))
  const query = getQuery(event)

  // 1. Recuperiamo prima l'associazione tramite lo slug
  const asd = await db.collection('associations').findOne({ slug })
  if (!asd) {
    throw createError({ statusCode: 404, message: 'Associazione non trovata' })
  }

  const asdStringId = asd._id.toString()
  const asdObjectId = ObjectId.isValid(asdStringId) ? new ObjectId(asdStringId) : asd._id
  
  // Se c'è un ID nell'URL, gestiamo il rolling SINGOLO MANUALE
  if (id) {
    if (!ObjectId.isValid(id)) {
      throw createError({ statusCode: 400, message: 'ID Generatore non valido' })
    }
    const generator = await db.collection('generators').findOne({ 
      _id: new ObjectId(id),
      //asd_slug: slug 
      association_id: { $in: [asdObjectId, asdStringId] }
    })

    if (!generator) {
      throw createError({ statusCode: 404, message: 'Generatore non trovato' })
    }

    // Per il manuale usiamo la target_date passata dal calendario
    const targetDate = body?.target_date ? new Date(body.target_date) : new Date()
    console.log(`Eseguo rolling manuale per generatore ${id} fino a ${targetDate.toISOString()}`)
    const result = await executeRolling(db, generator, targetDate)

    return { 
      success: true, 
      generated_count: result.count,
      last_date: result.last_date 
    }
  }

  // 2. Se NON c'è ID, gestiamo il rolling di GRUPPO (Filtrato o Globale)
  const category = query.category as string
  const filter: any = { 
    //asd_slug: slug,
    association_id: { $in: [asdObjectId, asdStringId] }, 
    status: 'active',
    is_published: true
 }
  
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