<script setup>
import { computed, ref, onMounted, watch } from 'vue'

const props = defineProps({
    modelValue: { type: Object, required: true },
    limitStartDate: { type: String, default: '' },
    limitEndDate: { type: String, default: '' },
    // La data di fine dell'ASD o del Corso (limite massimo di generazione)
    endDate: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue', 'runManualRolling'])

const update = (key, value) => {
    emit('update:modelValue', { ...props.modelValue, [key]: value })
}

// --- LOGICA DI CALCOLO DATE ---

// Helper per non superare mai la data di fine impostata
const clampToEndDate = (date) => {
    if (!props.endDate) return date
    const end = new Date(props.endDate)
    return date > end ? end : date
}

// Calcolo dell'orizzonte teorico basato sui rolling_days
const suggestedTargetDate = computed(() => {
    const days = props.modelValue.rolling_days || 0
    let target = new Date()
    target.setDate(target.getDate() + days)

    target = clampToEndDate(target)
    return target.toISOString().split('T')[0]
})

// Stato locale per l'input manuale (date picker)
const manualTargetDate = ref('')

// REATTIVITÀ: Se cambiano i rolling_days, aggiorna il suggerimento manuale
watch(suggestedTargetDate, (newVal) => {
    manualTargetDate.value = newVal
}, { immediate: true })

// PARACADUTE: Impedisce la selezione manuale oltre la end_date
watch(manualTargetDate, (newVal) => {
    const limit = props.endDate ? props.endDate.split('T')[0] : props.limitEndDate
    if (limit && newVal > limit) {
        manualTargetDate.value = limit
    }
})

// Calcolo Data Prossimo Rolling Automatico
const nextAutoDate = computed(() => {
    const last = props.modelValue.last_rolling_date
    const trigger = props.modelValue.rolling_trigger_days || 0
    if (!last) return 'IMMEDIATO'

    const d = new Date(last)
    d.setDate(d.getDate() - trigger)
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
})

// --- GESTIONE GIORNI SETTIMANALI ---

const days = [
    { id: 1, label: 'LUN' }, { id: 2, label: 'MAR' }, { id: 3, label: 'MER' },
    { id: 4, label: 'GIO' }, { id: 5, label: 'VEN' }, { id: 6, label: 'SAB' }, { id: 7, label: 'DOM' }
]

const toggleDay = (dayId) => {
    const currentDays = [...(props.modelValue.days_of_week || [])]
    const idx = currentDays.indexOf(dayId)
    if (idx > -1) currentDays.splice(idx, 1)
    else currentDays.push(dayId)
    update('days_of_week', currentDays)
}

const isRolling = ref(false)

const triggerManualRolling = async () => {
    if (!manualTargetDate.value) return alert("Seleziona una data target")
    isRolling.value = true
    try {
        await emit('runManualRolling', manualTargetDate.value)
    } finally {
        isRolling.value = false
    }
}

// Calcola quanti eventi verrebbero generati tra oggi e la data manuale selezionata
/*
const previewCount = computed(() => {
    if (!manualTargetDate.value || !props.modelValue.days_of_week?.length) return 0

    const start = new Date()
    const end = new Date(manualTargetDate.value)
    if (end < start) return 0

    let count = 0
    let current = new Date(start)

    // Iteriamo giorno per giorno fino alla data target
    while (current <= end) {
        // In JS getDay() è 0=DOM, 1=LUN... 7=DOM non esiste. 
        // Se i tuoi ID sono 1=LUN...7=DOM, convertiamo:
        let dayOfWeek = current.getDay()
        if (dayOfWeek === 0) dayOfWeek = 7 // Portiamo la domenica da 0 a 7

        if (props.modelValue.days_of_week.includes(dayOfWeek)) {
            count++
        }
        current.setDate(current.getDate() + 1)
    }
    return count
})*/
const previewCount = computed(() => {
    if (!manualTargetDate.value || !props.modelValue.days_of_week?.length) return 0

    // Partiamo dal giorno dopo l'ultima generazione, o da oggi
    const last = props.modelValue.last_rolling_date
        ? new Date(props.modelValue.last_rolling_date)
        : new Date()

    const start = new Date(last)
    start.setDate(start.getDate() + 1) // Iniziamo dal giorno successivo

    const end = new Date(manualTargetDate.value)
    if (end < start) return 0

    let count = 0
    let current = new Date(start)

    while (current <= end) {
        let dayOfWeek = current.getDay()
        if (dayOfWeek === 0) dayOfWeek = 7

        if (props.modelValue.days_of_week.includes(dayOfWeek)) {
            count++
        }
        current.setDate(current.getDate() + 1)
    }
    return count
})
</script>

<template>
    <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">

        <div class="flex items-center justify-between border-b border-gray-100 pb-4">
            <div class="flex flex-col">
                <h3 class="text-xs font-black text-chess-chocolate uppercase tracking-[0.2em] mb-1">Programmazione</h3>
                <p class="text-[10px] text-gray-400 font-bold uppercase mt-1">
                    Prossimo Rolling Automatico: <span class="text-blue-600">{{ nextAutoDate }}</span>
                </p>
            </div>
            <div class="flex flex-col items-end">
                <span class="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Ultimo Evento
                    Generato</span>
                <span class="text-sm font-mono font-bold text-chess-dark">
                    {{ modelValue.last_rolling_date ? modelValue.last_rolling_date.split('T')[0] : 'Nessun evento' }}
                </span>
            </div>
        </div>

        <div>
            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-3 text-center tracking-widest">Giorni
                di generazione settimanale</label>
            <div class="flex justify-between max-w-md mx-auto gap-2">
                <button v-for="d in days" :key="d.id" type="button" @click="toggleDay(d.id)" :class="modelValue.days_of_week.includes(d.id)
                    ? 'bg-amber-500 text-white scale-110 shadow-md border-amber-600'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200 border-transparent'"
                    class="w-10 h-10 text-[10px] rounded-full font-black transition-all flex items-center justify-center border-2">
                    {{ d.label }}
                </button>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">

            <div class="space-y-5 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div class="flex items-center gap-2">
                    <Icon name="fa6-solid:robot" class="text-amber-500" size="14" />
                    <h4 class="text-[10px] font-black uppercase text-gray-600 tracking-wider">Regole Automatiche</h4>
                </div>

                <div>
                    <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Finestra di Copertura
                        (Rolling Days)</label>
                    <div class="flex items-center gap-3">
                        <input :value="modelValue.rolling_days"
                            @input="update('rolling_days', parseInt($event.target.value))" type="number" min="1"
                            max="90"
                            class="w-16 p-2 bg-white border border-gray-200 rounded-lg font-bold text-center text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                        <span class="text-[10px] text-gray-500 italic">Genera eventi per {{ modelValue.rolling_days
                            }}gg.</span>
                    </div>
                </div>

                <div>
                    <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Anticipo di Generazione
                        (Trigger)</label>
                    <div class="flex items-center gap-3">
                        <input :value="modelValue.rolling_trigger_days"
                            @input="update('rolling_trigger_days', parseInt($event.target.value))" type="number" min="0"
                            max="30"
                            class="w-16 p-2 bg-white border border-gray-200 rounded-lg font-bold text-center text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                        <span class="text-[10px] text-gray-500 italic">Lancia il rolling {{
                            modelValue.rolling_trigger_days }}gg prima della fine scorta.</span>
                    </div>
                </div>

                <div class="flex items-center justify-between pt-2 border-t border-gray-200">
                    <span class="text-[10px] font-bold text-gray-500 uppercase">Pubblicazione Immediata</span>
                    <button @click="update('direct_publish', !modelValue.direct_publish)"
                        class="relative inline-flex h-5 w-10 items-center rounded-full transition-colors"
                        :class="modelValue.direct_publish ? 'bg-green-600' : 'bg-gray-300'">
                        <span class="h-3 w-3 transform rounded-full bg-white transition-transform shadow-sm"
                            :class="modelValue.direct_publish ? 'translate-x-6' : 'translate-x-1'" />
                    </button>
                </div>
            </div>

            <div class="space-y-4 p-4 bg-amber-50/50 rounded-xl border border-amber-100 flex flex-col justify-between">
                <div>
                    <div class="flex items-center gap-2 mb-3">
                        <Icon name="fa6-solid:hand-pointer" class="text-amber-600" size="14" />
                        <h4 class="text-[10px] font-black uppercase text-amber-600 tracking-wider">Lancio Manuale</h4>
                    </div>

                    <div class="mb-4">
                        <label class="block text-[9px] font-bold text-amber-700/60 uppercase mb-1">Genera eventi fino
                            al...</label>
                        <input v-model="manualTargetDate" type="date" :min="limitStartDate"
                            :max="endDate ? endDate.split('T')[0] : limitEndDate"
                            class="w-full p-2 bg-white border border-amber-200 rounded-lg text-sm font-bold text-amber-900 focus:ring-2 focus:ring-amber-500 outline-none" />


                        <div class="mt-3 flex items-center gap-2 p-2 bg-white/50 rounded-lg border border-amber-100">

                            <div
                                class="flex-shrink-0 w-14 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center text-[14px] font-black">
                                +{{ previewCount }}
                            </div>
                            <p class="text-[11px] text-amber-800 font-bold uppercase leading-tight">
                                {{ previewCount === 1 ? 'Evento verrà creato' : 'Eventi verranno creati' }}

                            </p>

                        </div>
                        <span class="block text-[10px] font-normal text-amber-600 lowercase italic">in base alla
                            selezione settimanale e alla data limite specificata sopra</span>

                    </div>
                </div>

                
                <button @click="triggerManualRolling" :disabled="isRolling || previewCount === 0" 
                    class="w-full py-3 bg-amber-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-md active:scale-95">
                    <Icon v-if="isRolling" name="fa6-solid:circle-notch" class="animate-spin mr-2" />
                    {{ isRolling ? 'Generazione in corso...' : 'Esegui Generazione Ora' }}
                </button>
            </div>

        </div>
    </div>
</template>