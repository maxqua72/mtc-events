<script setup>
definePageMeta({ layout: 'default' })

// Form state
const form = ref({ type: 'terms', version: '' })
const loading = ref(false)
const feedback = ref(null)

// HTML preview dei documenti attivi (per il link nel passo legale)
const isPreviewOpen = ref(false)
const previewContent = ref('')
const previewTitle = ref('')
const previewFileUrl = ref('')

const openPreview = (doc, type) => {
  if (!doc.content_html) return
  previewContent.value = doc.content_html
  previewTitle.value = `${type} - v${doc.version}`
  previewFileUrl.value = doc.url || ''
  isPreviewOpen.value = true
}

// Recupera i documenti attivi per la tabella
const { data: activeDocs, refresh, pending } = await useFetch('/api/legal/active-docs')

const syncDocument = async () => {
  if (!form.value.version) return alert('Inserisci il numero di versione!')
  
  loading.value = true
  feedback.value = null

  try {
    const response = await $fetch('/api/admin/sync-legal', {
      method: 'POST',
      body: form.value
    })
    
    feedback.value = { error: false, message: `Documento ${response.type} v${response.version} sincronizzato!` }
    await refresh()
    form.value.version = '' 
  } catch (e) {
    feedback.value = { error: true, message: e.statusMessage || 'Errore durante la sincronizzazione' }
  } finally {
    loading.value = false
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header Page -->
    <div class="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div>
        <h2 class="text-xl font-black text-chess-dark uppercase tracking-tight">Documenti Legali</h2>
        <p class="text-xs text-gray-500 mt-1">Sincronizza i file PDF del deploy con i metadati del database.</p>
      </div>
      <div class="flex items-center gap-3">
        <span v-if="feedback" :class="feedback.error ? 'text-red-500' : 'text-green-500'" class="text-[10px] font-black uppercase tracking-widest animate-pulse">
          {{ feedback.message }}
        </span>
        <Icon name="fa6-solid:file-shield" class="text-gray-200" size="24" />
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 italic">
      <!-- Form Card -->
      <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
        <h3 class="text-[11px] font-black uppercase tracking-widest text-chess-dark mb-6 flex items-center gap-2">
          <Icon name="fa6-solid:rotate" size="12" class="text-chess-gold" /> Attivazione Versione
        </h3>
        
        <div class="space-y-5 not-italic">
          <div>
            <label class="block text-[10px] uppercase text-gray-400 font-black mb-1.5 ml-1">Tipo Documento</label>
            <select v-model="form.type" class="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-chess-dark focus:ring-1 focus:ring-chess-gold outline-none transition-all">
              <option value="terms">Termini e Condizioni</option>
              <option value="privacy">Privacy Policy</option>
              <option value="cookies">Cookie Policy</option>
            </select>
          </div>

          <div>
            <label class="block text-[10px] uppercase text-gray-400 font-black mb-1.5 ml-1">Numero Versione (es. 1.0)</label>
            <input v-model="form.version" type="text" placeholder="Es. 1.1" 
              class="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-chess-dark focus:ring-1 focus:ring-chess-gold outline-none transition-all" />
          </div>

          <button @click="syncDocument" :disabled="loading"
            class="w-full bg-chess-dark text-chess-gold px-6 py-4 rounded-lg text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50">
            <Icon v-if="loading" name="fa6-solid:circle-notch" class="animate-spin" size="14" />
            {{ loading ? 'Sincronizzazione...' : 'Sincronizza PDF' }}
          </button>
        </div>
      </div>

      <!-- Active Versions Table -->
      <div class="xl:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div class="p-6 border-b border-gray-100">
          <h3 class="text-[11px] font-black uppercase tracking-widest text-chess-dark flex items-center gap-2">
            <Icon name="fa6-solid:list-check" size="12" class="text-chess-gold" /> Stato Attuale Database
          </h3>
        </div>

        <div v-if="pending" class="p-20 text-center">
          <Icon name="fa6-solid:circle-notch" class="animate-spin text-gray-200" size="32" />
        </div>

        <div v-else class="overflow-x-auto not-italic">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-100">
                <th class="px-6 py-4 text-[10px] uppercase font-black text-gray-400">Documento</th>
                <th class="px-6 py-4 text-[10px] uppercase font-black text-gray-400">Versione</th>
                <th class="px-6 py-4 text-[10px] uppercase font-black text-gray-400">Hash (SHA-256)</th>
                <th class="px-6 py-4 text-[10px] uppercase font-black text-gray-400">Data Attivazione</th>
                <th class="px-6 py-4 text-[10px] uppercase font-black text-gray-400">PWA Ready</th>
                <th class="px-6 py-4 text-[10px] uppercase font-black text-gray-400 text-center">Azioni</th>
                
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="(doc, key) in activeDocs" :key="key" class="hover:bg-gray-50/50 transition-colors">
                <td class="px-6 py-4">
                  <span class="text-xs font-black text-chess-dark uppercase tracking-tight">{{ key }}</span>
                </td>
                <td class="px-6 py-4">
                  <span class="px-2 py-1 bg-chess-gold/10 text-chess-dark text-[10px] font-bold rounded ring-1 ring-chess-gold/20">v{{ doc.version }}</span>
                </td>
                <td class="px-6 py-4">
                  <span class="text-[9px] font-mono text-gray-400 break-all leading-none">{{ doc.hash.substring(0, 24) }}...</span>
                </td>
                <td class="px-6 py-4">
                  <span class="text-[10px] text-gray-500 font-bold uppercase">{{ formatDate(doc.updated_at) }}</span>
                </td>

                <td class="px-6 py-4">
                    <div v-if="doc.content_html" 
                        @click="openPreview(doc, key)"
                        class="flex items-center gap-1.5 text-green-600 cursor-pointer hover:scale-105 transition-transform">
                        <Icon name="fa6-solid:circle-check" size="10" />
                        <span class="text-[9px] font-black uppercase underline decoration-dotted">HTML OK</span>
                    </div>
                    <div v-else class="flex items-center gap-1.5 text-gray-300">
                        <Icon name="fa6-solid:circle-xmark" size="10" />
                        <span class="text-[9px] font-black uppercase">Solo PDF</span>
                    </div>
                </td>
                
                <td class="px-6 py-4 text-center">
                  <a :href="doc.url" target="_blank" 
                    class="inline-flex items-center justify-center p-2 text-chess-dark hover:text-chess-gold transition-colors"
                    title="Visualizza PDF">
                    <Icon name="fa6-solid:file-pdf" size="16" />
                  </a>
                </td>
              </tr>
              <tr v-if="!activeDocs || Object.keys(activeDocs).length === 0">
                <td colspan="5" class="px-6 py-10 text-center text-gray-400 text-xs uppercase font-bold tracking-widest">
                  Nessun documento sincronizzato nel database
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  <LegalPreviewModal 
    v-model="isPreviewOpen" 
    :content="previewContent" 
    :title="previewTitle" 
    :file-url="previewFileUrl"
    />
</template>