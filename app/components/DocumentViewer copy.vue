<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
    fileUrl: { type: String, default: '' },
    title: { type: String, default: 'Documento' }
})

const isOpen = ref(false)

// Riconosce se la risorsa è un'immagine
const isImage = computed(() => {
    if (!props.fileUrl) return false
    return /\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(props.fileUrl)
})

// Calcola l'URL appropriato per l'iframe (Proxy Google per PDF esterni)
const iframeUrl = computed(() => {
    if (!props.fileUrl) return ''

    // Se è un link assoluto esterno
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
        document.body.style.overflow = 'hidden' // Blocca lo scroll sotto
    }
}

const close = () => {
    isOpen.value = false
    if (typeof document !== 'undefined') {
        document.body.style.overflow = ''
    }
}

// Chiusura tramite tasto ESC
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
                class="fixed inset-0 z-[9999] bg-chess-dark/95 backdrop-blur-sm flex flex-col w-screen h-screen overflow-hidden">

                <!-- Header di Navigazione in-app -->
                <header
                    class="h-14 bg-chess-dark text-white border-b border-white/10 px-4 flex items-center justify-between shrink-0 shadow-md">
                    <button @click="close"
                        class="flex items-center gap-2 bg-white/10 hover:bg-chess-gold hover:text-chess-dark text-white px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all">
                        <Icon name="fa6-solid:arrow-left" size="14" />

                    </button>

                    <h3
                        class="text-xs font-bold uppercase tracking-widest text-chess-gold truncate max-w-[40%] text-center">
                        {{ title }}
                    </h3>

                    <a :href="fileUrl" target="_blank" download
                        class="flex items-center gap-2 text-xs font-bold text-gray-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                        title="Scarica file originale">
                        <Icon name="fa6-solid:download" size="14" />
                        <span class="hidden sm:inline">Scarica</span>
                    </a>
                </header>

                <!-- Viewer Content (Immagine o PDF) -->
                <main
                    class="flex-1 w-full h-[calc(100vh-56px)] bg-black/70 flex items-center justify-center p-4 overflow-hidden">

                    <!-- Container Immagine: usa flex, items-center e justify-center per la centratura perfetta -->
                    <div v-if="isImage" class="w-full h-full flex items-center justify-center p-2">
                        <img :src="fileUrl" :alt="title"
                            class="max-w-full max-h-full object-contain rounded-lg shadow-2xl m-auto" />
                    </div>

                    <!-- Render PDF / Documento via iframe -->
                    <iframe v-else :src="iframeUrl"
                        class="w-full h-full border-0 rounded-lg bg-white shadow-2xl"></iframe>
                </main>
            </div>
        </Transition>
    </Teleport>
</template>