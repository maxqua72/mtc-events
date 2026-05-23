// server/tasks/events/rolling.ts
export default defineTask({
  meta: {
    name: "events:rolling",
    description: "Generazione notturna automatica degli eventi ricorrenti",
  },
  async run() {
    const db = await getDb()
    
    // Il task notturno processa TUTTE le ASD, ma solo i generatori PUBBLICATI
    const generators = await db.collection('generators').find({
      status: 'active',
      is_published: true
    }).toArray()

    let totalEventsCreated = 0
    const details = []

    for (const gen of generators) {
      const daysToCover = gen.recurrence?.rolling_days || 30
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() + daysToCover)
      
      const rollingResult = await executeRolling(db, gen, targetDate)
      // Accumuliamo il totale globale degli eventi creati
      totalEventsCreated += rollingResult.count

      // Se vuoi un dettaglio per singolo generatore (opzionale ma utilissimo per i log)
      if (rollingResult.count > 0) {
        details.push({
          generator_id: gen._id,
          name: gen.name || 'Senza nome',
          created: rollingResult.count,
          upTo: rollingResult.last_date.toISOString().split('T')[0] // Formato YYYY-MM-DD
        })
      }
    }
    
    return { 
      result: `Processati ${generators.length} generatori`,
      total_created: totalEventsCreated,
      details: details.length > 0 ? details : "Nessun nuovo evento srotolato"
    }
  },
})