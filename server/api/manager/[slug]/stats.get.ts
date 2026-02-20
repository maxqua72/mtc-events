export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const db = await getDb()
  
  const now = new Date()
  // Calcolo date corretto
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(now.getFullYear() - 1)
  
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(now.getDate() + 30)

  const asd = await db.collection('associations').findOne({ slug })
  if (!asd) throw createError({ statusCode: 404, statusMessage: 'ASD non trovata' })

  // Tipizziamo i risultati per evitare l'errore 'any'
  // Nota: se non usi TypeScript nel backend, puoi rinominare il file in .js 
  // o aggiungere il commento // @ts-nocheck in alto.
  // Ma ecco la versione corretta:
  const members = await db.collection('memberships')
    .find({ association_id: asd._id })
    .toArray() as any[] // Sostituisci any con la tua interfaccia Member se ce l'hai

  const events = await db.collection('events')
    .find({ association_id: asd._id })
    .toArray() as any[]

  return {
    members: {
      // Un utente è "attivo" se la scadenza è oltre i prossimi 30 giorni
      active: members.filter((m) => new Date(m.expiry_date) > thirtyDaysFromNow).length,
      
      // "In scadenza" se scade tra oggi e i prossimi 30 giorni
      expiring: members.filter((m) => {
        const d = new Date(m.expiry_date)
        return d > now && d <= thirtyDaysFromNow
      }).length,
      
      // "Scaduti recenti" se scaduti da oggi fino a un anno fa
      expired_recent: members.filter((m) => {
        const d = new Date(m.expiry_date)
        return d <= now && d > oneYearAgo
      }).length,
      
      // "Persi" se scaduti da più di un anno
      lost: members.filter((m) => new Date(m.expiry_date) <= oneYearAgo).length
    },
    activities: {
      tournaments: {
        published: events.filter((e) => e.category === 'tournament' && e.status === 'published').length,
        draft: events.filter((e) => e.category === 'tournament' && e.status === 'draft').length
      },
      courses: {
        published: events.filter((e) => e.category === 'course' && e.status === 'published').length,
        draft: events.filter((e) => e.category === 'course' && e.status === 'draft').length
      },
      free_play: {
        published: events.filter((e) => e.category === 'free_play' && e.status === 'published').length,
        draft: events.filter((e) => e.category === 'free_play' && e.status === 'draft').length
      }
    }
  }
})