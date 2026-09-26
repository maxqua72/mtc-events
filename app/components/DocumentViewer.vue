<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
    fileUrl: { type: String, default: '' },
    title: { type: String, default: 'Documento' }
})

const isOpen = ref(false)

// Riconosce se la risorsa è un'immagine, anche senza estensione, gestendo data-URI, PDF e rotte API note
const isImage = computed(() => {
    console.log(`Verifica se fileUrl è immagine: ${props.fileUrl}`)
    if (!props.fileUrl) return false
    
    // Controlla se è un data-URI immagine
    console.log(`Controllo data-URI: ${props.fileUrl.startsWith('data:image/')}`)
    if (props.fileUrl.startsWith('data:image/')) return true
    
    // Controlla se è esplicitamente un PDF
    const isPdf = /\.pdf($|\?)/i.test(props.fileUrl)
    console.log(`Controllo PDF: ${isPdf}`)
    if (isPdf) return false

    // Estensioni immagine comuni
    const commonImageExtensions = /\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(props.fileUrl)
    console.log(`Controllo estensioni immagine: ${commonImageExtensions}`)
    if (commonImageExtensions) return true

    // --- AGGIUNTA FONDAMENTALE PER IL TUO CASO ---
    // Rileva se l'URL appartiene alla tua rotta API per gli asset (confermata dall'inspector)
    // L'URL è /api/assets/<ID>
    const isApiAssetRoute = props.fileUrl.includes('/api/assets/')
    console.log(`Controllo rotta API asset: ${isApiAssetRoute}`)
    if (isApiAssetRoute) return true
    // --------------------------------------------

    // Se non ha estensione e non è un'altra rotta esterna nota, proviamo a considerarla immagine
    // per forzare il tag <img> e testare l'errore al caricamento
    const noExtension = !props.fileUrl.includes('.')
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : ''
    const isInternal = !props.fileUrl.startsWith('http') || props.fileUrl.includes(currentHost)
    console.log(`Controllo rotta interna: ${isInternal}`)

    if (noExtension && isInternal) return true

    return false
})

// Calcola l'URL appropriato per l'iframe (Proxy Google per PDF esterni)
const iframeUrl = computed(() => {
    if (!props.fileUrl) return ''

    if (props.fileUrl.startsWith('http://') || props.fileUrl.startsWith('https://')) {
        const currentHost = typeof window !== 'undefined' ? window.location.hostname : ''
        const isExternal = !props.fileUrl.includes(currentHost)

        if (isExternal && !isImage.value) {
            return `https://docs.google.com/viewer?url=${encodeURIComponent(props.fileUrl)}&embedded=true`
        }
    }
    return props.fileUrl
})

const open = () => {
    isOpen.value = true
    if (typeof document !== 'undefined') {
        document.body.style.overflow = 'hidden'
    }
}

const close = () => {
    isOpen.value = false
    if (typeof document !== 'undefined') {
        document.body.style.overflow = ''
    }
}

const handleKeyDown = (e) => {
    if (e.key === 'Escape' && isOpen.value) {
        close()
    }
}

onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
    if (typeof document !== 'undefined') {
        document.body.style.overflow = ''
    }
})

defineExpose({ open, close })
</script>

<template>
    <Teleport to="body">
        <Transition enter-active-class="transition opacity-100 duration-200 ease-out" enter-from-class="opacity-0"
            leave-active-class="transition opacity-0 duration-150 ease-in" leave-to-class="opacity-0">
            <div v-if="isOpen"
                class="fixed inset-0 z-[9999] bg-chess-dark/95 backdrop-blur-sm flex flex-col w-screen h-screen overflow-hidden select-none">

                <!-- Header di Navigazione -->
                <header
                    class="h-14 bg-chess-dark text-white border-b border-white/10 px-4 flex items-center justify-between shrink-0 shadow-md z-10">
                    <button @click="close"
                        class="flex items-center gap-2 bg-white/10 hover:bg-chess-gold hover:text-chess-dark text-white px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all">
                        <Icon name="fa6-solid:arrow-left" size="14" />
                    </button>

                    <h3
                        class="text-xs font-bold uppercase tracking-widest text-chess-gold truncate max-w-[40%] text-center">
                        {{ title }}
                    </h3>
<!--    
                    <a :href="fileUrl" target="_blank" download
                        class="flex items-center gap-2 text-xs font-bold text-gray-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                        title="Scarica file originale">
                        <Icon name="fa6-solid:download" size="14" />
                        <span class="hidden sm:inline">Scarica</span>
                    </a>-->
                    <div></div>
                </header>

                <!-- Viewer Content -->
                <main class="flex-1 w-full min-h-0 bg-black/70 flex items-center justify-center p-2 sm:p-4 overflow-auto touch-manipulation relative z-0">

                    <!-- Container Immagine adattato 100% senza scrollbar, pronto per lo zoom -->
                    <div v-if="isImage" class="w-full h-full flex items-center justify-center">
                        <img :src="fileUrl" :alt="title"
                            class="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-2xl m-auto pointer-events-auto transition-transform" />
                    </div>

                    <!-- Render PDF / Documento -->
                    <iframe v-else :src="iframeUrl"
                        class="w-full h-full border-0 rounded-lg bg-white shadow-2xl"></iframe>
                </main>
            </div>
        </Transition>
    </Teleport>
</template>