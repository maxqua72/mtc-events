// server/utils/rolling.ts
import { ObjectId } from 'mongodb'
export const executeRolling = async (db, generator, targetDate) => {
  const eventsToCreate = []
  let currentDate = new Date() // Partiamo da oggi
  const daysOfWeek = generator.recurrence.days_of_week // [1, 3, 5]
  
  // Limite invalicabile: la end_date della matrice
  const absoluteLimit = generator.end_date ? new Date(generator.end_date) : targetDate
  const effectiveTarget = targetDate > absoluteLimit ? absoluteLimit : targetDate

  // Troviamo l'ultima data generata per non creare duplicati
  let lastGenerated = generator.recurrence.last_rolling_date 
    ? new Date(generator.recurrence.last_rolling_date) 
    : new Date()

  // Avanziamo di un giorno rispetto all'ultima generazione
  let checkDate = new Date(lastGenerated)
  checkDate.setDate(checkDate.getDate() + 1)

  while (checkDate <= effectiveTarget) {
    let day = checkDate.getDay()
    if (day === 0) day = 7 // Fix Domenica

    if (daysOfWeek.includes(day)) {
      // 1. Cloniamo l'oggetto matrice
    const eventData = { ...generator }
    
    // 2. RIMUOVIAMO l'ID originale della matrice 
    // altrimenti insertMany proverà a inserire più documenti con lo stesso ID
    delete eventData._id 

    const newEvent = {
        ...eventData,
        _id: new ObjectId(), 
        generator_id: generator._id, // Riferimento corretto alla matrice
        start_date: new Date(checkDate),
        is_published: generator.recurrence?.direct_publish || false,
        created_at: new Date(),
        updated_at: new Date()
    }
    
    delete newEvent.recurrence
    eventsToCreate.push(newEvent)
    }
    checkDate.setDate(checkDate.getDate() + 1)
  }

  if (eventsToCreate.length > 0) {
    await db.collection('events').insertMany(eventsToCreate)
    
    // Aggiorniamo la matrice con l'ultima data coperta
    const lastDate = eventsToCreate[eventsToCreate.length - 1].start_date
    await db.collection('generators').updateOne(
      { _id: generator._id },
      { $set: { 'recurrence.last_rolling_date': lastDate } }
    )
    
    return { count: eventsToCreate.length, last_date: lastDate }
  }

  return { count: 0, last_date: generator.recurrence.last_rolling_date }
}