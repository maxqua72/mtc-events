<script setup>
const props = defineProps({
  initialData: { type: Object, required: true },
  asdSlug: { type: String, required: true }
})

const emit = defineEmits(['save', 'cancel', 'manual-rolling'])

// Reattività locale per la parte specifica del generatore (la ricorrenza)
const recurrenceData = ref({ ...props.initialData.recurrence })

// Funzione ponte: riceve i dati dell'evento (pieni) dal form di EventEditor
// e li unisce ai dati di ricorrenza prima di mandare tutto al server
const handleFinalSave = (eventFields) => {
  const finalPayload = {
    ...eventFields,             // Qui ci sono titolo, categoria, location, etc.
    recurrence: recurrenceData.value // Qui c'è la logica dei giorni e rolling
  }
  emit('save', finalPayload)
}

const handleManualRolling = (targetDate) => {
  // Se serve il rolling manuale, passiamo lo stato attuale completo
  emit('manual-rolling', { 
    generator: { ...props.initialData, recurrence: recurrenceData.value }, 
    target_date: targetDate 
  })
}
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-8">
    
    <EventEditor 
      :event="initialData" 
      :asd-slug="asdSlug"
      :is-generator="true"
      @save="handleFinalSave" 
      @cancel="emit('cancel')"
    >
      <template #additional-fields>
        
          
          
          <RecurrenceEditor 
            v-model="recurrenceData"
            :limit-start-date="initialData.start_date"
            :end-date="initialData.end_date"
            @runManualRolling="handleManualRolling"
          />
        
      </template>
    </EventEditor>

    </div>
</template>