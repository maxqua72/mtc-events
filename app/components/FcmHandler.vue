<script setup>
/**
 * Gestore Notifiche Universale
 * Copre: Admin, Manager e Soci (Identities)
 */
const nuxtApp = useNuxtApp()
const userStore = useUserStore()
const route = useRoute()

// Evitiamo loop infiniti se la sincronizzazione fallisce
const lastSyncedSlug = ref(null)

const syncToken = async () => {
  const asdSlug = route.params.asd_slug
  if (!asdSlug) return

  // Recuperiamo il plugin direttamente dall'istanza nuxtApp
  const fcm = nuxtApp.$fcm

  // 1. Identifichiamo l'utente corrente per questa ASD
  // Può essere un Manager (auth) o un Socio (identity)
  const identity = userStore.identities[asdSlug]
  const managerEmail = userStore.auth?.email
  const memberEmail = identity?.email
  
  // L'email da usare: priorità al manager, poi al socio
  const currentUserEmail = managerEmail || memberEmail

  // Debug per capire cosa succede
  console.log('[FCM] Tentativo sync:', { 
    email: currentUserEmail, 
    pluginReady: !!fcm,
    asd: asdSlug,
    alreadySynced: lastSyncedSlug.value === asdSlug 
  })

  // 3. BLOCCO DIFENSIVO: Se il plugin non è pronto o l'email manca, esci senza errori
  if (!fcm || !currentUserEmail) {
    return 
  }

  // 2. Procediamo solo se abbiamo un'email (quindi non è un GUEST semplice)
  // e se non abbiamo già sincronizzato questo slug in questa sessione
  if (lastSyncedSlug.value !== asdSlug) {
    try {
      const token = await fcm.requestForToken()
      
      // syncToken viene chiamato sia da onMounted che dai watch, quindi è possibile che il token sia già stato sincronizzato per questa ASD.
      if (token && userStore.fcmToken !== token) {
        // Chiamiamo l'azione dello store per il salvataggio
        // Passiamo l'email esplicita perché il manager potrebbe avere un'email diversa dal socio
        await $fetch(`/api/asd/${asdSlug}/sync-fcm-token`, {
          method: 'POST',
          body: { 
            email: currentUserEmail, 
            token: token 
          }
        })
        
        userStore.setFcmToken(token)
        lastSyncedSlug.value = asdSlug
        console.log(`[FCM] Token sincronizzato per ${currentUserEmail} su ASD: ${asdSlug}`)
      }
    } catch (err) {
      console.error('[FCM] Errore sincronizzazione:', err)
    }
  }
}



// Unico punto di controllo: osserva slug e dati utente
// Monitoriamo il cambio di ASD nella URL
// Monitoriamo se l'utente effettua il login (diventa Manager o Socio)
// FcmHandler.vue

watch(
  // Osserviamo i valori singolarmente avvolti in una funzione getter
  () => [route.params?.asd_slug, userStore?.auth, userStore?.identities],
  (newValues, oldValues) => {
    // 1. Controllo di sicurezza: se i nuovi valori non sono definiti, usciamo
    if (!newValues || !newValues[0]) return

    const newSlug = newValues[0]
    const oldSlug = oldValues ? oldValues[0] : null

    // 2. Se lo slug è cambiato rispetto a prima, resettiamo per permettere nuovo sync
    if (newSlug !== oldSlug) {
      lastSyncedSlug.value = null
    }

    // 3. Eseguiamo il sync
    syncToken()
  },
  { deep: true, immediate: true }
)
</script>

<template>
  <div v-if="false" />
</template>