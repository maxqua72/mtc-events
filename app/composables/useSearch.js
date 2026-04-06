// app/composables/useSearch.js
import { useUserStore } from '~/stores/user'

export const useSearch = () => {

  

  const userStore = useUserStore()
  const route = useRoute()
  
  const searchQuery = useState('searchQuery', () => '')
  const isSearching = ref(false)
  const results = ref({ events: [], members: [] })

  // 1. Determiniamo il contesto basandoci sull'URL
  const searchContext = computed(() => {
    const path = route.path
    if (path.includes('/events')) return 'EVENTS'
    if (path.includes('/memberships')) return 'MEMBERS'
    return 'GLOBAL'
  })

  // 2. Verifichiamo i permessi dal caricamento locale (senza DB)
  const canSearchMembers = computed(() => {
    const slug = route.params.asd_slug
    if (!slug) return false

    // Controlliamo l'identità specifica per questa ASD nello store
    const identity = userStore.identities[slug]
    
    // Un utente può cercare i soci se:
    // - È l'Admin globale (auth.is_admin)
    // - O se l'identità di questa ASD ha il flag is_manager o il ruolo MANAGER
    return userStore.auth?.is_admin || 
           identity?.role === 'MANAGER' || 
           identity?.is_manager === true
  })

  const executeSearch = async (slug) => {
    // Se siamo in EVENTS o MEMBERS, non chiamare il server! 
    // Filtriamo i dati già presenti in pagina per risparmiare traffico.
    if (searchContext.value !== 'GLOBAL') return

    if (searchQuery.value.length < 2) {
      results.value = { events: [], members: [] }
      return
    }

    isSearching.value = true
    try {
      // 3. Logica di filtro intelligente per la chiamata API
      // Includiamo i soci SOLO se l'utente è autorizzato (da store locale)
      // E se non siamo nella pagina specifica degli eventi
      const includeMembers = canSearchMembers.value && searchContext.value !== 'EVENTS'

      const data = await $fetch(`/api/asd/${slug}/search`, {
        params: { 
          q: searchQuery.value,
          includeMembers: includeMembers 
        }
      })

      // 4. Pulizia finale dei risultati per coerenza UI
      if (searchContext.value === 'EVENTS') {
        results.value = { events: data.events, members: [] }
      } else if (searchContext.value === 'MEMBERS') {
        results.value = { events: [], members: data.members }
      } else {
        results.value = data
      }
    } catch (e) {
      console.error("Errore durante la ricerca:", e)
    } finally {
      isSearching.value = false
    }
  }

  // Reset alla navigazione
  watch(() => route.path, () => {
    searchQuery.value = ''
    results.value = { events: [], members: [] }
  })

  return { 
    searchQuery, 
    results, 
    isSearching, 
    executeSearch, 
    searchContext,
    canSearchMembers
  }
}