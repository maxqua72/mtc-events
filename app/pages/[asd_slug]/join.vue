<template>
    <div class="min-h-screen bg-chess-dark flex flex-col items-center justify-center p-6 text-center">

        <div v-if="status === 'processing'" class="animate-pulse space-y-8">
            <div class="w-20 h-20 border-4 border-chess-gold border-t-transparent rounded-full animate-spin mx-auto">
            </div>
            <div class="space-y-3">
                <h2 class="text-white text-xl font-black uppercase tracking-widest">Verifica Iscrizione</h2>
                <p class="text-chess-gold/60 text-sm italic">Stiamo convalidando la tua tessera digitale...</p>
            </div>
        </div>

        <div v-if="status === 'input'" class="w-full max-w-sm space-y-8 animate-in fade-in duration-500">
            <div class="space-y-4">
                <div class="relative w-24 h-24 mx-auto group">
                    <div
                        class="relative w-full h-full flex items-center justify-center overflow-hidden shadow-2xl">
                        <img v-if="asdStore.info?.logo_url"
                            :src="asdStore.info.logo_url" :alt="asd_slug"
                            class="w-full h-full object-cover p-2" />
                        <Icon v-else name="fa6-solid:shield-halved" class="text-chess-gold text-4xl" />
                    </div>
                </div>

                <div class="space-y-2">
                    <h2 class="text-white text-2xl font-black uppercase tracking-tight">
                        {{ asdStore.info?.name || 'Attiva Profilo' }}
                    </h2>
                    <p class="text-chess-gold/60 text-sm">
                        Inserisci il codice di 6 caratteri ricevuto via email
                    </p>
                </div>
            </div>

            <div class="space-y-4">
                <!-- <input 
          v-model="manualToken" 
          maxlength="6"
          placeholder="ES: H7K-92X"
          class="w-full bg-white/5 border-2 border-white/10 rounded-xl px-4 py-4 text-center text-3xl font-mono text-white tracking-[0.3em] focus:border-chess-gold outline-none transition-all uppercase placeholder:text-white/10"
          @input="manualToken = manualToken.toUpperCase()"
        />
      -->
                <ShortTokenInput v-model="manualToken" @submit="handleJoin" :disabled="status === 'processing'" />

                <p v-if="errorMessage"
                    class="text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-500/10 py-2 rounded-lg">
                    {{ errorMessage }}
                </p>
                <button @click="handleJoin(manualToken)" :disabled="manualToken.length < 6 || status === 'processing'"
                    class="w-full py-4 font-black uppercase rounded-xl transition-all shadow-lg
                        disabled:bg-white/5 disabled:text-white/20
                        enabled:bg-chess-gold enabled:text-black enabled:hover:scale-[1.02] enabled:active:scale-95"
                    :class="{ '!bg-red-500/20 !text-red-500 border border-red-500/50': errorMessage }">
                    <span v-if="status === 'processing'" class="flex items-center justify-center gap-2">
                        <div class="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                        Verifica...
                    </span>

                    <span v-else-if="errorMessage">
                        Codice Errato - Riprova
                    </span>

                    <span v-else>
                        {{ manualToken.length < 6 ? 'Inserisci Codice' : 'Conferma e Accedi' }} </span>
                </button>
            </div>

            <button @click="skipToEvents"
                class="text-white/40 text-[10px] uppercase font-black tracking-widest hover:text-white transition-colors">
                Prosegui come visitatore
            </button>
        </div>

        <div v-if="status === 'success'" class="w-full max-w-md space-y-10 animate-in zoom-in duration-500">
            <div class="space-y-6">
                <div
                    class="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(34,197,94,0.3)]">
                    <Icon name="fa6-solid:check" class="text-white text-4xl" />
                </div>

                <div class="space-y-2">
                    <h2 class="text-white text-3xl font-black tracking-tight uppercase">Ciao, {{ memberData?.name }}!
                    </h2>
                    <p class="text-chess-gold font-bold uppercase tracking-widest text-sm italic">Socio riconosciuto con
                        successo</p>
                </div>
            </div>

            <div class="grid gap-4 px-4">
                <div v-if="pwaStore.canInstall" class="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4">
                    <p class="text-white/80 text-xs leading-relaxed">
                        Per ricevere le notifiche in tempo reale sui tuoi turni e risultati, installa l'app ufficiale
                        sulla tua home.
                    </p>
                    <button @click="pwaStore.installApp()"
                        class="w-full py-4 bg-white text-black font-black uppercase rounded-xl hover:bg-chess-gold transition-colors flex items-center justify-center gap-3">
                        <Icon name="fa6-solid:download" />
                        Installa l'App
                    </button>
                </div>

                <button @click="skipToEvents"
                    class="w-full py-4 bg-white/5 text-white font-black uppercase rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                    Vai al Calendario Eventi
                </button>
            </div>
        </div>

        <IosInstallModal v-if="pwaStore.showInstallGuidance" @close="pwaStore.showInstallGuidance = false" />

    </div>
</template>

<script setup>
const route = useRoute()
const asd_slug = route.params.asd_slug
const urlToken = route.query.t // Token lungo da email

const userStore = useUserStore()
const pwaStore = usePwaStore()
const { isPWA } = usePwaUtils()

const status = ref(urlToken ? 'processing' : 'input') // 'processing' | 'input' | 'success'
const manualToken = ref('')
const memberData = ref(null)
const errorMessage = ref('')

const asdStore = useAsdStore()

definePageMeta({
    layout: false
})

watch(manualToken, () => {
    if (errorMessage.value) errorMessage.value = ''
})

/**
 * Gestisce la logica di Join (sia token lungo che corto)
 */
const handleJoin = async (tokenToVerify) => {
    const finalToken = typeof tokenToVerify === 'string' ? tokenToVerify : manualToken.value
    if (!finalToken ||
        finalToken.length < 6) return

    status.value = 'processing'
    errorMessage.value = ''

    try {
        const data = await $fetch(`/api/asd/${asd_slug}/join`, {
            params: { t: finalToken }
        })

        // Salviamo i dati nello store
        memberData.value = data
        userStore.setAsdProfile(asd_slug, data)

        status.value = 'success'

        // LOGICA DI REDIRECT AUTOMATICO:
        // Se siamo già dentro la PWA, l'utente non deve vedere tasti "Installa".
        // Lo mandiamo subito agli eventi dopo 1.5s di feedback positivo.
        if (isPWA()) {
            setTimeout(() => skipToEvents(), 1500)
        }else {
            // Redirect di cortesia per chi è su browser/PC
            // Diamo 3 secondi per far vedere il segno di spunta verde
            setTimeout(() => skipToEvents(), 3000)
        }
    } catch (e) {
        status.value = 'input'
        errorMessage.value = e.statusMessage || 'Codice non valido o scaduto.'

    }
}

const skipToEvents = () => {
    navigateTo(`/${asd_slug}/events`)
}

onMounted(async () => {
    // Inizializziamo il rilevamento PWA (ascolto beforeinstallprompt, etc.)
    pwaStore.initPwaDetection()

    // --- RIGA DA AGGIUNGERE PER IL TEST ---
    // Forza l'apertura del modal appena la pagina carica
    //pwaStore.showInstallGuidance = true
    // --------------------------------------

    await nextTick() // Aspetta che Pinia sia idratato

    // Se arriviamo con un token nell'URL, proviamo subito il join
    if (urlToken) {
        handleJoin(urlToken)
    } else {
        // Altrimenti, se non siamo identificati, chiediamo il codice corto
        if (!userStore.identities[asd_slug]?.email) {
            status.value = 'input'
        } else {
            // Se è già socio, lo mandiamo via
            skipToEvents()
        }
    }
})
</script>

<style scoped>
.animate-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}
</style>