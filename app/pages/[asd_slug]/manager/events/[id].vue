<script setup>
const route = useRoute()
const router = useRouter()
const { asd_slug, id } = route.params

// Fetch dei dati dell'evento
const { data: event } = await useFetch(`/api/manager/${asd_slug}/events/${id}`)

const handleSave = async (payload) => {
  await $fetch(`/api/manager/${asd_slug}/events/${id}`, {
    method: 'PUT',
    body: payload
  })
  router.push(`/${asd_slug}/manager/events`)
}
</script>

<template>
  <EventEditor 
    :event="event" 
    :asd-slug="asd_slug" 
    @save="handleSave"
    @cancel="router.back()"
  />
</template>