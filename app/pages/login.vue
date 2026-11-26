<script setup>
// Login con username e password per admin (e utenti con credenziali).
// Non dipende da nessuna ASD: è l'accesso di sistema, utilizzabile anche a DB vuoto.
// Il server (/api/auth/login) verifica le credenziali e sigilla il cookie di sessione;
// lo store si limita a rileggere la sessione con setAdminAuth.
definePageMeta({
  layout: false
})

const route = useRoute()
const userStore = useUserStore()

const form = ref({ username: '', password: '' })
const status = ref('input') // 'input' | 'processing' | 'change_password'
const errorMessage = ref('')

const isButtonDisabled = computed(() =>
  status.value === 'processing' || !form.value.username.trim() || !form.value.password
)

// Accetta solo percorsi interni (evita open redirect verso altri domini)
const safeRedirect = () => {
  const r = route.query.redirect
  return typeof r === 'string' && r.startsWith('/') && !r.startsWith('//') && !r.startsWith('/\\')
    ? r
    : null
}

const goToArea = () => {
  const auth = userStore.auth
  if (!auth) return false

  const redirect = safeRedirect()
  if (auth.is_admin) {
    navigateTo(redirect || '/admin')
    return true
  }
  const firstSlug = auth.managed_asds?.[0]?.asd_slug
  if (firstSlug) {
    navigateTo(redirect || `/${firstSlug}/manager/dashboard`)
    return true
  }
  return false
}

const login = async (username, password) => {
  status.value = 'processing'
  errorMessage.value = ''

  try {
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { username, password }
    })

    if (response.must_change_password) {
      status.value = 'change_password'
      return
    }

    await userStore.setAdminAuth(response.permissions)

    if (!goToArea()) {
      await userStore.logout()
      status.value = 'input'
      errorMessage.value = 'Questo utente non ha un\'area di gestione.'
    }
  } catch (e) {
    status.value = 'input'
    errorMessage.value = e?.statusCode === 401
      ? 'Credenziali non valide.'
      : 'Errore di connessione. Riprova.'
  }
}

const handleSubmit = () => {
  if (isButtonDisabled.value) return
  login(form.value.username.trim(), form.value.password)
}

// Dopo il cambio password il server non apre una sessione:
// rifacciamo il login con la nuova password per ottenerla.
const handlePasswordChanged = (_permissions, newPassword) => {
  form.value.password = newPassword
  login(form.value.username.trim(), newPassword)
}

watch(form, () => {
  if (errorMessage.value) errorMessage.value = ''
}, { deep: true })

// Se c'è già una sessione valida, niente form: si va direttamente all'area di gestione
onMounted(() => {
  goToArea()
})
</script>

<template>
  <div class="fixed inset-0 z-[999] bg-chess-dark flex items-center justify-center p-4">

    <div class="absolute inset-0 opacity-[0.03] pointer-events-none"
         style="background-image: radial-gradient(#fff 1px, transparent 1px); background-size: 30px 30px;">
    </div>

    <div class="w-full max-w-[400px] relative">
      <div class="bg-chess-iron border border-white/10 rounded-2xl p-8 md:p-10 shadow-2xl relative overflow-hidden">

        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-chess-gold to-transparent"></div>

        <div class="text-center mb-10">
          <div class="w-16 h-16 bg-white/5 border border-chess-gold/20 rounded-xl mx-auto flex items-center justify-center mb-6 shadow-xl">
            <Icon name="fa6-solid:chess-knight" class="text-chess-gold text-3xl" />
          </div>
          <h1 class="text-xl font-black text-white uppercase tracking-[0.2em]">Area Riservata</h1>
          <p class="text-gray-500 text-sm font-bold tracking-[0.3em] mt-2 italic">Amministrazione di sistema</p>
        </div>

        <!-- Cambio password obbligatorio al primo accesso -->
        <div v-if="status === 'change_password'" class="space-y-4 text-center">
          <p class="text-chess-gold/80 text-sm">
            Al primo accesso è necessario scegliere una nuova password.
          </p>
          <ChangePasswordInput
            :username="form.username.trim()"
            :old-password="form.password"
            @success="handlePasswordChanged"
          />
        </div>

        <!-- Form di login -->
        <form v-else @submit.prevent="handleSubmit" class="space-y-6">
          <LoginInput
            v-model="form"
            :disabled="status === 'processing'"
            @submit="handleSubmit"
          />

          <button
            type="submit"
            :disabled="isButtonDisabled"
            class="w-full bg-chess-gold hover:bg-yellow-500 disabled:bg-gray-700 disabled:text-white/30 text-chess-dark py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-[0.98] shadow-lg shadow-chess-gold/5"
          >
            <span v-if="status !== 'processing'" class="flex items-center justify-center gap-2">
              Accedi <Icon name="fa6-solid:arrow-right-to-bracket" size="12" />
            </span>
            <span v-else class="flex items-center justify-center gap-2 animate-pulse">
              Verifica in corso...
            </span>
          </button>
        </form>

        <div v-if="errorMessage"
             class="mt-8 p-4 rounded-xl border text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 bg-red-500/10 border-red-500/20 text-red-400">
          <Icon name="fa6-solid:triangle-exclamation" />
          {{ errorMessage }}
        </div>
      </div>
    </div>
  </div>
</template>
