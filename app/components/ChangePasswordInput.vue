<template>
    <div class="w-full space-y-3 animate-in fade-in duration-300">
        <p class="text-chess-gold text-[10px] font-black uppercase tracking-widest mb-4">
            Cambio Password Obbligatorio
        </p>
        <div class="space-y-2">
            <input v-model="form.newPassword" type="password" placeholder="NUOVA PASSWORD"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white font-black uppercase outline-none focus:border-chess-gold transition-all" />
            <input v-model="form.confirmPassword" type="password" placeholder="CONFERMA PASSWORD"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white font-black uppercase outline-none focus:border-chess-gold transition-all" />
        </div>
        <p v-if="localError"
            class="text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-500/10 py-2 rounded-lg animate-in fade-in duration-200">
            {{ localError }}
        </p>
        <button @click="submitChange" :disabled="!isValid || isProcessing"
            class="w-full py-4 bg-chess-gold text-black font-black uppercase rounded-xl disabled:opacity-50">
            <span v-if="isProcessing" class="flex items-center justify-center gap-2">
                <div class="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                Aggiornamento...
            </span>
            <span v-else>Aggiorna e Accedi</span>
        </button>
    </div>
</template>

<script setup>
const localError = ref('')
const props = defineProps(['username', 'oldPassword'])
const emit = defineEmits(['success'])

const form = ref({ newPassword: '', confirmPassword: '' })
const isProcessing = ref(false)
const isValid = computed(() =>
    form.value.newPassword.length >= 8 &&
    form.value.newPassword === form.value.confirmPassword
)

// 3. Watcher per pulire gli errori
watch(form, () => {
    if (localError.value) localError.value = ''
}, { deep: true })

const submitChange = async () => {
    if (!isValid.value || isProcessing.value) return
    localError.value = ''
    try {
        const data = await $fetch('/api/auth/update-password', {
            method: 'PATCH',
            body: {
                username: props.username,
                oldPassword: props.oldPassword, // La password provvisoria usata poco fa
                newPassword: form.value.newPassword
            }
        })
        emit('success', data.permissions)
    } catch (e) {
        localError.value = e.statusMessage || "Impossibile aggiornare la password."
    } finally {
    isProcessing.value = false
  }
}
</script>