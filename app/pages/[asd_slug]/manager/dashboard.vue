<template>
  <div class="space-y-10">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-black text-chess-dark uppercase tracking-tight">Dashboard Manager</h1>
        <p class="text-chess-chocolate font-medium text-sm italic">Torre di controllo di {{ asdStore.info?.name }}</p>
      </div>
      
    </div>

    <section v-if="stats">
      <div class="flex items-center gap-2 mb-4 px-1">
        <div class="h-3 w-1 bg-chess-gold rounded-full"></div>
        <h2 class="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Anagrafica & Soci</h2>
      </div>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Soci Attivi" 
          subTitle="regolari"
          :value="stats.members.active"
          icon="fa6-solid:user-check"
          color="green"
          trend="In Regola"
          footerLabel="Member List"
        />

        <StatCard 
          label="In Scadenza" 
          subTitle="entro 30gg"
          :value="stats.members.expiring"
          icon="fa6-solid:hourglass-half"
          color="orange"
          trend="Priorità"
          footerLabel="Retention"
        />

        <StatCard 
          label="Scaduti Recenti" 
          subTitle="< 12 mesi"
          :value="stats.members.expired_recent"
          icon="fa6-solid:user-minus"
          color="red"
          trend="Recuperabili"
          footerLabel="Rinnovi"
        />

        <StatCard 
          label="Soci Persi" 
          subTitle="oltre 1 anno"
          :value="stats.members.lost"
          icon="fa6-solid:user-xmark"
          color="gray"
          trend="Archiviati"
          footerLabel="Churn Rate"
        />
      </div>
    </section>

    <section v-if="stats">
      <div class="flex items-center gap-2 mb-4 px-1">
        <div class="h-3 w-1 bg-chess-gold rounded-full"></div>
        <h2 class="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Gestione Attività</h2>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard 
          label="Tornei" 
          subTitle="pubblicati"
          :value="stats.activities.tournaments.published"
          :subValue="stats.activities.tournaments.draft"
          icon="fa6-solid:trophy"
          color="gold"
          trend=""
          footerLabel="Competizioni"
        />

        <StatCard 
          label="Corsi" 
          subTitle="pubblicati"
          :value="stats.activities.courses.published"
          :subValue="stats.activities.courses.draft"
          icon="fa6-solid:graduation-cap"
          color="blue"
          trend=""
          footerLabel="Didattica"
        />

        <StatCard 
          label="Gioco Libero" 
          subTitle="sessioni"
          :value="stats.activities.free_play.published"
          :subValue="stats.activities.free_play.draft"
          icon="fa6-solid:chess-board"
          color="blue"
          trend=""
          footerLabel="Pratica"
        />

        <StatCard 
          label="Altro" 
          subTitle="servizi attivi"
          value="0"
          :subValue="0"
          icon="fa6-solid:ellipsis"
          color="gray"
          trend=""
          footerLabel="Servizi Vari"
        />
      </div>
    </section>

    
  </div>
</template>

<script setup>
const route = useRoute()
const asd_slug = route.params.asd_slug
const asdStore = useAsdStore()

const { data: stats } = await useFetch(`/api/manager/${asd_slug}/stats`)
</script>