<script setup>
definePageMeta({ layout: 'default' })
const route = useRoute()
const { asd_slug } = route.params

// Recuperiamo prima le info dell'ASD per avere l'ID
const { data: asd } = await useFetch(`/api/asd/${asd_slug}`)

// Recuperiamo la lista soci filtrata per questa ASD
const { data: members, refresh } = await useFetch(`/api/manager/${asd_slug}/memberships`)

const showModal = ref(false)
const selectedMember = ref(null)
const isSending = ref(null) // Conterrà l'ID del membro in fase di invio

const openModal = (member = null) => {
  selectedMember.value = member
  showModal.value = true
}

const deleteMember = async (id) => {
  if (confirm('Rimuovere definitivamente questo socio?')) {
    await $fetch(`/api/manager/${asd_slug}/memberships/${id}`, { method: 'DELETE' })
    refresh()
  }
}


// Funzione per inviare l'email con il link di Join tramite Resend
// Funzione per inviare l'email con gestione quote e coda
const sendJoinLink = async (member, force = false) => {
  // Se non è una forzatura (secondo tentativo), chiedi conferma
  if (!force) {
    const confirmSend = confirm(`Inviare l'invito ufficiale a ${member.email}?`);
    if (!confirmSend) return;
  }

  isSending.value = member._id

  try {
    const res = await $fetch(`/api/manager/${asd_slug}/memberships/${member._id}/send-invite`, {
      method: 'POST',
      body: { force_queue: force }
    })

    // Gestione del superamento quota
    if (res.code === 'QUOTA_EXCEEDED') {
      let message = '';
      if (res.reason === 'monthly') {
        message = `⚠️ LIMITE MENSILE RAGGIUNTO (${res.monthlySent}/${res.monthlyLimit}).\n\n` +
                  `L'invito potrà essere inviato solo all'inizio del mese prossimo.\n` +
                  `Vuoi comunque metterlo in coda?`;
      } else {
        message = `📅 LIMITE GIORNALIERO RAGGIUNTO (${res.dailySent}/${res.dailyLimit}).\n\n` +
                  `L'invito verrà inviato automaticamente domani mattina.\n` +
                  `Vuoi metterlo in coda?`;
      }

      const userChoice = confirm(message);

      if (userChoice) {
        // Riesegui la funzione passando force = true
        await sendJoinLink(member, true);
      }
      return;
    }

    // IMPORTANTE: Aggiorniamo i dati della tabella
    await refresh();

    // Feedback basato sullo stato di accodamento
    if (res.queued) {
      alert('📧 Limite raggiunto: l\'invito è stato messo in coda e verrà inviato domani.');
    } else {
      alert('📧 Email inviata con successo!');
    }

  } catch (err) {
    console.error('Errore invio:', err)
    alert(err.data?.statusMessage || 'Errore durante l\'invio dell\'email.')
  } finally {
    isSending.value = null
  }
}
/*
const sendJoinLink = async (member) => {
  // Feedback visivo immediato (opzionale ma consigliato)
  const confirmSend = confirm(`Inviare l'invito ufficiale a ${member.email}?`);
  if (!confirmSend) return;

  isSending.value = member._id
  try {
    // Puntiamo alla nuova rotta che include lo slug dell'ASD e l'ID della membership
    await $fetch(`/api/manager/${asd_slug}/memberships/${member._id}/send-invite`, {
      method: 'POST'
      // Non serve passare il body, il server recupera email e token dall'ID nell'URL
    })
    
    alert('📧 Email inviata con successo! Il socio riceverà il link di attivazione.')
  } catch (err) {
    console.error('Errore invio:', err)
    alert('Errore durante l\'invio dell\'email. Verifica la configurazione di Resend.')
  } finally {
    isSending.value = null
  }
}*/

// Funzione per inviare una notifica Push di test
const sendTestPush = async (member) => {
  const message = prompt("Inserisci un messaggio per la notifica di test:", "Ciao " + member.name + "!");
  if (!message) return;

  try {
    await $fetch(`/api/manager/${asd_slug}/send-test-push`, {
      method: 'POST',
      body: {
        email: member.email,
        title: "Test Manager",
        body: message
      }
    })
    alert('Notifica inviata!')
  } catch (err) {
    alert('Errore nell\'invio della notifica')
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h2 class="text-xl font-black text-chess-dark uppercase">Anagrafica Soci</h2>
      <button @click="openModal()"
        class="bg-chess-dark text-chess-gold px-5 py-2.5 rounded-lg text-[11px] font-black uppercase flex items-center gap-2">
        <Icon name="fa6-solid:user-plus" /> Nuovo Socio
      </button>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <table class="w-full text-left border-collapse">
        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="p-4 text-[10px] font-black uppercase text-gray-400">Socio</th>
            <th class="p-4 text-[10px] font-black uppercase text-gray-400">email</th>
            <th class="p-4 text-[10px] font-black uppercase text-gray-400">Scadenza</th>
            <th class="p-4 text-[10px] font-black uppercase text-gray-400">Stato</th>
            <th class="p-4"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="m in members || []" :key="m._id" class="hover:bg-gray-50 transition-colors">
            <td class="py-2 px-4">
              <p class="font-bold text-chess-dark">{{ m.name }}</p>
            </td>
            <td class="py-2 px-4 font-mono text-xs text-chess-chocolate">{{ m.email || 'Nessuna email' }}</td>
            
            <td class="py-2 px-4 text-xs font-bold">{{ new Date(m.expiry_date).toLocaleDateString() }}</td>
            <td class="py-2 px-4">
              <span class="px-2 py-1 rounded text-[9px] font-black uppercase"
                :class="m.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                {{ m.status }}
              </span>
            </td>
            <td class="p-2 text-right space-x-2">
              <div class="flex items-center justify-end gap-2">
                <template v-if="m.is_email_pending">
                  <div
                    class="flex items-center gap-1.5 px-2 py-1 bg-orange-50 text-orange-600 rounded-md border border-orange-100 cursor-help"
                    :title="'Invio programmato: ' + new Date(m.scheduled_at).toLocaleString()">
                    <Icon name="fa6-solid:clock" class="text-[10px] animate-pulse" />
                    <span class="text-[9px] font-black uppercase tracking-wider">In Coda</span>
                  </div>
                </template>

                <button v-else @click="sendJoinLink(m)" :disabled="isSending === m._id" title="Invia link di Join"
                  class="p-1.5 rounded-lg transition-colors"
                  :class="isSending === m._id ? 'text-blue-300 cursor-not-allowed' : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'">
                  <Icon :name="isSending === m._id ? 'svg-spinners:ring-resize' : 'fa6-solid:envelope-open-text'"
                    class="text-lg" />
                </button>

                <button v-if="m.fcm_tokens?.length" @click="sendTestPush(m)" title="Invia Push di test"
                  class="text-gray-400 hover:text-orange-500 transition-colors">
                  <Icon name="fa6-solid:bell" />
                </button>

                <button @click="openModal(m)" class="text-gray-400 hover:text-chess-gold">
                  <Icon name="fa6-solid:pen" />
                </button>
                <button @click="deleteMember(m._id)" class="text-gray-400 hover:text-red-500">
                  <Icon name="fa6-solid:trash" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Teleport to="body">
      <MembershipModal v-if="showModal" :membership="selectedMember" :asdId="asd?._id" :asdSlug="asd_slug"
        @close="showModal = false" @save="refresh(); showModal = false" />
    </Teleport>
  </div>
</template>