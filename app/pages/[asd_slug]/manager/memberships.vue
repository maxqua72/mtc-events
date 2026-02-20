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
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h2 class="text-xl font-black text-chess-dark uppercase">Anagrafica Soci</h2>
      <button @click="openModal()" class="bg-chess-dark text-chess-gold px-5 py-2.5 rounded-lg text-[11px] font-black uppercase flex items-center gap-2">
        <Icon name="fa6-solid:user-plus" /> Nuovo Socio
      </button>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <table class="w-full text-left border-collapse">
        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="p-4 text-[10px] font-black uppercase text-gray-400">Socio</th>
            <th class="p-4 text-[10px] font-black uppercase text-gray-400">email</th>
            <th class="p-4 text-[10px] font-black uppercase text-gray-400">Codice</th>
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
            <td class="py-2 px-4 font-mono text-xs text-chess-chocolate">{{ m.member_code }}</td>
            <td class="py-2 px-4 text-xs font-bold">{{ new Date(m.expiry_date).toLocaleDateString() }}</td>
            <td class="py-2 px-4">
              <span class="px-2 py-1 rounded text-[9px] font-black uppercase" 
                :class="m.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                {{ m.status }}
              </span>
            </td>
            <td class="p-2 text-right space-x-2">
              <button @click="openModal(m)" class="text-gray-400 hover:text-chess-gold"><Icon name="fa6-solid:pen" /></button>
              <button @click="deleteMember(m._id)" class="text-gray-400 hover:text-red-500"><Icon name="fa6-solid:trash" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Teleport to="body">
      <MembershipModal 
        v-if="showModal" 
        :membership="selectedMember" 
        :asdId="asd?._id"
        :asdSlug="asd_slug"
        @close="showModal = false" 
        @save="refresh(); showModal = false" 
      />
    </Teleport>
  </div>
</template>