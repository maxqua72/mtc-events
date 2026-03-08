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

    for (const gen of generators) {
      const daysToCover = gen.recurrence?.rolling_days || 30
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() + daysToCover)
      
      await executeRolling(db, gen, targetDate)
    }
    
    return { result: `Processati ${generators.length} generatori` }
  },
})