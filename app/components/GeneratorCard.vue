<script setup>
const props = defineProps(['generator', 'asdSlug'])
const emit = defineEmits(['delete', 'roll'])

const allDays = [1, 2, 3, 4, 5, 6, 7]
const daysMap = { 1: 'LUN', 2: 'MAR', 3: 'MER', 4: 'GIO', 5: 'VEN', 6: 'SAB', 7: 'DOM' }

const formatDate = (dateStr) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const currentCoverage = computed(() => formatDate(props.generator.recurrence?.last_rolling_date) || 'Nessun evento')

const potentialTargetDate = computed(() => {
    const rollingDays = props.generator.recurrence?.rolling_days || 0
    const target = new Date()
    target.setDate(target.getDate() + rollingDays)

    if (props.generator.end_date) {
        const eventLimit = new Date(props.generator.end_date)
        return target > eventLimit ? eventLimit : target
    }
    return target
})

const potentialCoverage = computed(() => formatDate(potentialTargetDate.value))

const eventsToBeGenerated = computed(() => {
    const daysOfWeek = props.generator.recurrence?.days_of_week || []
    if (daysOfWeek.length === 0) return 0
    let start = props.generator.recurrence?.last_rolling_date
        ? new Date(props.generator.recurrence.last_rolling_date)
        : new Date()
    start.setDate(start.getDate() + 1)
    const end = potentialTargetDate.value
    let count = 0
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dayNum = d.getDay() === 0 ? 7 : d.getDay()
        if (daysOfWeek.includes(dayNum)) count++
    }
    return count
})

const nextAutoRollingDate = computed(() => {
    const lastCoverage = props.generator.recurrence?.last_rolling_date
    const triggerDays = props.generator.recurrence?.rolling_trigger_days || 0
    if (!lastCoverage) return 'Immediato'
    const triggerDate = new Date(lastCoverage)
    triggerDate.setDate(triggerDate.getDate() - triggerDays)
    return formatDate(triggerDate)
})

const isDayActive = (day) => props.generator.recurrence?.days_of_week?.includes(day)
</script>

<template>
    <div class="relative group">
        <EventCard :event="generator" :slug="`/${asdSlug}/manager/generators/${generator._id}`">
            <template #extra>
                <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-2 ml-1">Programmazione
                    Settimanale</p>
                <div class="mt-1 mb-4">
                    <div class="inline-flex p-1 gap-1">
                        <div v-for="day in allDays" :key="day"
                            class="w-8 h-8 flex items-center justify-center text-[10px] font-black transition-all aspect-square"
                            :class="isDayActive(day)
                                ? 'bg-chess-dark text-chess-gold shadow-md scale-105 rounded-full border border-chess-gold/30'
                                : 'text-gray-400 bg-gray-200 rounded-full border border-gray-200 opacity-50'">
                            {{ daysMap[day] }}
                        </div>
                    </div>
                </div>

                <div class="flex flex-wrap gap-y-4 gap-x-6 pt-4 border-t border-gray-100">

                    <div class="flex items-start gap-2 min-w-[140px]">
                        <div>
                            <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Eventi Generati fino al
                            </p>
                            <p class="text-sm font-black text-chess-dark leading-tight">{{ currentCoverage }}</p>
                        </div>
                    </div>

                    <div class="flex items-start gap-2 min-w-[250px] flex-1">
                        <div>
                            <div class="flex items-center gap-2 flex-wrap">
                                <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Orizzonte Prossimo
                                    Rolling</p>
                                
                            </div>
                            <div class="flex items-center gap-2 mt-0.5">
                                <span class="text-sm font-black text-amber-600 leading-tight">{{ potentialCoverage
                                    }}</span>
                                <span
                                    class="text-[11px] font-black bg-amber-100 text-amber-700 px-2 py-1 rounded-full border border-amber-200 whitespace-nowrap">
                                    +{{ eventsToBeGenerated }} eventi
                                </span>
                                <span
                                    class="text-[11px] font-black bg-amber-100 text-amber-700 px-2 py-1 rounded-full border border-amber-200 whitespace-nowrap">
                                    max {{ generator.recurrence?.rolling_days }}gg
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="flex items-start gap-2 min-w-[300px] flex-1">
                        <div>
                            <div class="flex items-center gap-2 flex-wrap">
                                <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Rolling Automatico</p>
                                
                            </div>
                            <div class="flex items-center gap-2 mt-0.5">
                                <span class="text-sm font-black text-blue-600 uppercase leading-tight">{{ nextAutoRollingDate
                                    }}</span>
                                
                                <span
                                    class="text-[11px] font-black bg-white text-blue-600 px-2 py-1 rounded-full border border-blue-200 whitespace-nowrap">
                                    -{{ generator.recurrence?.rolling_trigger_days }}gg dall'ultimo evento
                                </span>
                                
                            </div>
                        </div>
                    </div>

                    

                </div>
            </template>
        </EventCard>

        <div class="absolute bottom-4 right-4 flex gap-2 z-20">
            <button @click.stop.prevent="$emit('roll')"
                class="w-10 h-10 bg-amber-500 shadow-xl rounded-full flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all border border-white"
                title="Estendi copertura ora">
                <Icon name="fa6-solid:arrows-rotate" size="14" />
            </button>
            <NuxtLink :to="`/${asdSlug}/manager/generators/${generator._id}`"
                class="w-10 h-10 bg-white shadow-xl rounded-full flex items-center justify-center text-chess-dark hover:text-chess-gold hover:scale-110 active:scale-95 transition-all border border-gray-100">
                <Icon name="fa6-solid:gear" size="14" />
            </NuxtLink>
            <button @click.stop.prevent="$emit('delete')"
                class="w-10 h-10 bg-white shadow-xl rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 hover:scale-110 active:scale-95 transition-all border border-gray-100">
                <Icon name="fa6-solid:trash-can" size="14" />
            </button>
        </div>
    </div>
</template>