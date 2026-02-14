<script setup>
definePageMeta({ layout: 'manager' })
const route = useRoute()
const asdSlug = route.params.asd_slug

const { data: asd } = await useFetch(`/api/manager/${asdSlug}/info`)
const { data: memberships, refresh } = await useFetch(`/api/manager/${asdSlug}/memberships`)

// Logica colori per lo stato (Hybrid Pro style: colori desaturati con bordi scuri)
const getStatusStyles = (expiryDate) => {
  const now = new Date()
  const expiry = new Date(expiryDate)
  if (expiry < now) return 'bg-red-50 text-red-600 border-red-100'
  const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))
  if (diffDays <= 30) return 'bg-amber-50 text-amber-600 border-amber-100'
  return 'bg-emerald-50 text-emerald-600 border-emerald-100'
}
</script>

<template>
    
  <div>
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
      <div>
        <h2 class="text-3xl font-black tracking-tight text-slate-900">Anagrafica Soci</h2>
        <p class="text-slate-500 font-medium">Gestisci le iscrizioni e i rinnovi delle tessere.</p>
      </div>
      <button class="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold shadow-xl shadow-slate-200 hover:scale-[1.02] transition-transform active:scale-95">
        + Nuovo Socio
      </button>
    </header>


    <div class="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/50 border-b border-slate-100">
              <th class="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Socio</th>
              <th class="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Codice</th>
              <th class="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stato Scadenza</th>
              <th class="p-6"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-for="m in memberships" :key="m._id" class="group hover:bg-slate-50 transition-colors">
              <td class="p-6">
                <p class="font-bold text-slate-900">{{ m.name }}</p>
                <p class="text-xs text-slate-400">{{ m.email }}</p>
              </td>
              <td class="p-6">
                <code class="text-[10px] font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">{{ m.member_code }}</code>
              </td>
              <td class="p-6">
                <span :class="getStatusStyles(m.expiry_date)" class="px-3 py-1 rounded-lg border text-[10px] font-bold uppercase">
                  {{ new Date(m.expiry_date).toLocaleDateString('it-IT') }}
                </span>
              </td>
              <td class="p-6 text-right">
                <button class="p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all">
                   <span class="text-slate-400 font-bold text-xs uppercase px-2">Dettagli</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>