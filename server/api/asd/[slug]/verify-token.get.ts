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

      const maskedEmail = maskEmail(decrypt(membership.email))

      return {
        id_membership: membership._id.toString(),
        name: membership.name,
        email: maskedEmail,
        role: 'MEMBER',
        asd_profile: { 
          id_membership: membership._id.toString(),
          name: membership.name,
          email: maskedEmail,
          start_date: membership.start_date,
          expiry_date: membership.expiry_date,
          role: 'MEMBER' } // Questo è l'oggetto completo per userStore.setAsdProfile
      }
    }
  } else {
    console.log('Token 9 caratteri ricevuto, cerchiamo nella collezione managers con:', { longTokenSearch, normalizedToken })

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
      
      //const permissions = await $fetch('/api/auth/permissions', { query: { email: user.email } })
      const maskedEmail = maskEmail(user.email)

      // Verifichiamo se l'utente è anche socio
      const membership = await db.collection('memberships').findOne({
        association_id: asd._id,
        email: encrypt(user.email),
        status: 'active'
      })  

      // Restituiamo SOLO i dati sbloccati da QUESTO token
      const asdProfile = {
        id_manager: managerEntry._id.toString(),
        id_membership: membership ? membership._id.toString() : null,
        name: user.name,
        email: maskedEmail,
        role: 'MANAGER',
        start_date: membership?.start_date || null,
        expiry_date: membership?.expiry_date || null
      }

      // --- INIZIO LOGICA SESSIONE SICURA (IL "JOIN" 10/10) ---
      
      // 1. Recuperiamo la sessione esistente (se il manager gestisce già altre ASD)
      const session = await getUserSession(event)
      const sessuser = session.user as any
      const rawManagedAsds = sessuser?.managed_asds || []

      // 2. SANATORIA DATI CORROTTI (De-duplicazione immediata all'origine)
      // Usiamo una Map usando 'asd_slug' come chiave univoca. 
      // Se ci sono duplicati nel cookie dell'utente, la Map terrà solo l'ultimo, eliminando i doppioni.
      const cleanedMap = new Map(
        rawManagedAsds.map((item: any) => [item.asd_slug, item])
      )
      
      // Trasformiamo nuovamente la Map in un array pulito
      const currentManagedAsds = Array.from(cleanedMap.values())

      // 2. Aggiungiamo la nuova ASD evitando duplicati
      const alreadyManaged = currentManagedAsds.some((a: any) => a.asd_slug === slug)
      if (!alreadyManaged) {
        currentManagedAsds.push({
          asd_id: asd._id.toString(),
          asd_slug: asd.slug,
          asd_name: asd.name,
          role: 'MANAGER'
        })
      }

      // 3. SIGILLIAMO IL COOKIE CRITTOGRAFATO
      // Questo è l'unico punto dove salviamo i permessi "forti"
      await setUserSession(event, {
        user: {
          id: user._id.toString(),
          email: user.email,
          is_admin: user.is_admin || false, // Se è anche admin globale lo scriviamo qui
          managed_asds: currentManagedAsds
        }
      })

      // --- FINE LOGICA SESSIONE SICURA ---

      return {
        id_manager: managerEntry._id.toString(),
        id_membership: membership ? membership._id.toString() : null,
        name: user.name,
        email: user.email,
        role: 'MANAGER',
        asd_profile: asdProfile,
        // Dati per managed_asds (da aggiungere al cookie)
        new_managed_asd: {
          //_id: asd._id.toString(),
          asd_id: asd._id.toString(),
          asd_slug: asd.slug,
          asd_name: asd.name,
          role: 'MANAGER'
        }
      }
    }
  }

  // Se nessuno dei due matchha
  throw createError({ statusCode: 403, statusMessage: 'Codice non valido o scaduto.' })

})