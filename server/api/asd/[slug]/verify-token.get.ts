import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const { t: rawToken } = getQuery(event)
  const db = await getDb()

  if (!rawToken) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Token mancante'
    })
  }

  // Prepariamo le due versioni del token:
  // 1. Quella "As Is" per il token lungo (preserva i trattini dell'UUID)
  const longTokenSearch = rawToken.toString().trim()
  
  // 2. Quella "Normalizzata" per il token corto (rimuove trattini e uppercase)
  const normalizedToken = rawToken.toString().replace(/-/g, '').trim().toUpperCase()

  // 1. Trova l'ASD per assicurarci che lo slug sia corretto
  const asd = await db.collection('associations').findOne({ slug })
  if (!asd) {
    throw createError({ statusCode: 404, statusMessage: 'Associazione non trovata' })
  }

  console.log('ASD trovato:', asd.name, 'con ID:', asd._id)


  // ALGORITMO:
  // 1. Se il token è un UUID completo (o di 6 char), cerchiamo nella collezione
  //    "memberships" per il campo "join_token"
  // 2. Se il token è di 9 caratteri (o non matcha come UUID), cerchiamo nella collezione
  //    "managers" per il campo "manager_token"
  // 3. Se troviamo una corrispondenza in "memberships", restituiamo i dati del socio
  // 4. Se troviamo una corrispondenza in "managers", recuperiamo l'utente associato 
  //    e i suoi permessi
  // 5. Se non troviamo nulla, restituiamo un errore di token non valido o scaduto

  if(normalizedToken.length !== 9) {
    console.log('Token corto ricevuto, cerchiamo nella collezione memberships con:', { longTokenSearch, normalizedToken })
    
    // 2. Cerca la membership corrispondente al token e all'ASD
    // --- TENTATIVO A: SOCIO (Memberships) ---
    const membership = await db.collection('memberships').findOne({
      association_id: asd._id,
      status: 'active', // Solo soci attivi possono fare la join
      $or: [
        { join_token: longTokenSearch },  // Cerca l'UUID completo (con trattini)
        { short_token: normalizedToken } // Cerca il codice corto (senza trattini)
      ]
    })

    if (membership) {
      const now = new Date()
      if (new Date(membership.expiry_date) < now) {
        throw createError({ statusCode: 403, statusMessage: 'Iscrizione scaduta.' })
      }
      return {
        name: membership.name,
        email: membership.email,
        role: 'MEMBER',
        id: membership._id.toString(),
        asd_profile: { 
          name: membership.name,
          email: membership.email,
          start_date: membership.start_date,
          expiry_date: membership.expiry_date,
          role: 'MEMBER' } // Questo è l'oggetto completo per userStore.setAsdProfile
      }
    }
  } else {
    console.log('Token lungo ricevuto, cerchiamo nella collezione managers con:', { longTokenSearch, normalizedToken })

    // --- TENTATIVO B: MANAGER (Manager Token a 9 caratteri) ---
    // Cerchiamo il token nella collezione managers (assumendo che il campo sia 'manager_token')
    const managerEntry = await db.collection('managers').findOne({
      association_id: asd._id,
      manager_token: normalizedToken // Quello da 9 caratteri
    })

    console.log('Manager entry trovata:', managerEntry)

    if (managerEntry) {
      // Se troviamo il token, dobbiamo recuperare i permessi completi tramite l'email dell'utente
      // Recuperiamo l'utente associato al manager_entry
      const user = await db.collection('users').findOne({ _id: managerEntry.user_id })
      if (!user) throw createError({ statusCode: 404, statusMessage: 'Utente manager non configurato' })

      // Chiamiamo internamente la logica dei permessi (o la duplichiamo per velocità)
      // In alternativa, facciamo un redirect interno o restituiamo il formato permissions.get.ts
      
      const permissions = await $fetch('/api/auth/permissions', { query: { email: user.email } })

      // Verifichiamo se l'utente è anche socio
      const membership = await db.collection('memberships').findOne({
        association_id: asd._id,
        email: user.email,
        status: 'active'
      })  
      if (membership) {
        // Se è anche socio, possiamo arricchire i dati con il profilo ASD
        const asdProfile = { 
          name: membership.name,
          email: membership.email,
          start_date: membership.start_date,
          expiry_date: membership.expiry_date,
          role: 'MANAGER' }
        return {
          name: user.name,
          email: user.email,
          role: 'MANAGER',
          id: managerEntry._id.toString(), // Serve per aggiornare il consenso legale
          asd_profile: asdProfile, // Questo è l'oggetto completo per userStore.setAsdProfile
          permissions: permissions // Questo è l'oggetto completo per userStore.setAuth
        }

      }

      return {
        name: user.name,
        email: user.email,
        role: 'MANAGER',
        id: managerEntry._id.toString(), // Serve per aggiornare il consenso legale
        permissions: permissions // Questo è l'oggetto completo per userStore.setAuth
      }
    }
  }

  // Se nessuno dei due matchha
  throw createError({ statusCode: 403, statusMessage: 'Codice non valido o scaduto.' })

  
  // 4. Restituiamo solo i dati necessari allo store dell'utente
  // Non restituiamo l'intero documento per privacy
  /*
  return {
    name: membership.name,
    email: membership.email,
    member_code: membership.member_code,
    start_date: membership.start_date,
    expiry_date: membership.expiry_date,
    role: 'MEMBER' // Identifichiamo l'utente come socio da ora in poi
  }*/
})