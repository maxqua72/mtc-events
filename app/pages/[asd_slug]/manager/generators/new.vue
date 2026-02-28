<script setup>
const route = useRoute()
const router = useRouter()
const asdSlug = route.params.asd_slug

definePageMeta({ layout: 'default' })

// Stato iniziale coerente con l'EventEditor e la logica di rolling
const generatorData = ref({
  title: '',
  description: '',
  category: 'corso',
  is_published: false,
  // Limiti della matrice (start_date è quando iniziano le ricorrenze)
  start_date: new Date().toISOString().split('T')[0],
  end_date: '', 
  start_time: '09:00',
  end_time: '11:00',
  registration_time: '',
  // Location e contatti (ereditati dall'ASD o vuoti)
  location: '',
  address: '',
  city: '',
  province: '',
  country: 'Italy',
  // Logica di Ricorrenza
  recurrence: {
    days_of_week: [],
    rolling_days: 30,
    direct_publish: false,
    last_rolling_date: null,
    rolling_trigger_days: 7 
  },
  circuit: 'none',
  image_url: ''
})

const handleSave = async (payload) => {
  try {
    // Il payload arriva dal GeneratorEditor (che unisce Event + Recurrence)
    await $fetch(`/api/manager/${asdSlug}/generators`, {
      method: 'POST',
      body: payload // Il payload contiene già tutto l'oggetto form
    })
    
    // Torniamo alla lista dei generatori
    router.push(`/${asdSlug}/manager/generators`)
  } catch (e) {
    console.error("Errore salvataggio generatore:", e)
    alert("Errore durante il salvataggio. Verifica i dati inseriti.")
  }
}

const handleCancel = () => {
  router.push(`/${asdSlug}/manager/generators`)
}
</script>

<template>
  <div class="max-w-7xl mx-auto py-8 px-4">
    

    <GeneratorEditor 
      :initial-data="generatorData"
      :asd-slug="asdSlug"
      @save="handleSave"
      @cancel="handleCancel"
    />
  </div>
</template>