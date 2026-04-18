<template>
  <div class="flex flex-col items-center gap-4">
    <div class="flex items-center gap-2 sm:gap-3">
      <template v-for="(digit, index) in 3" :key="index">
        <input
          ref="inputs"
          v-model="digits[index]"
          type="text"
          maxlength="1"
          inputmode="text"
          class="w-10 h-14 sm:w-12 sm:h-16 bg-white/5 border-2 border-white/10 rounded-xl text-center text-2xl font-mono text-white focus:border-chess-gold outline-none transition-all uppercase"
          @input="handleInput($event, index)"
          @keydown="handleKeyDown($event, index)"
          @paste="handlePaste"
        />
      </template>

      <span class="text-chess-gold/40 font-bold text-xl px-1">-</span>

      <template v-for="(digit, index) in 3" :key="index + 3">
        <input
          ref="inputs"
          v-model="digits[index + 3]"
          type="text"
          maxlength="1"
          inputmode="text"
          class="w-10 h-14 sm:w-12 sm:h-16 bg-white/5 border-2 border-white/10 rounded-xl text-center text-2xl font-mono text-white focus:border-chess-gold outline-none transition-all uppercase"
          @input="handleInput($event, index + 3)"
          @keydown="handleKeyDown($event, index + 3)"
          @paste="handlePaste"
        />
      </template>
    </div>
  </div>
</template>

<script setup>
const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue', 'submit'])

const digits = ref(['', '', '', '', '', ''])
const inputs = ref([])

// Sincronizza il valore esterno con i singoli quadratini
watch(digits, (newVal) => {
  const token = newVal.join('').toUpperCase()
  emit('update:modelValue', token)
  //if (token.length === 6) emit('complete', token)
}, { deep: true })

const handleInput = (e, index) => {
  const val = e.target.value
  if (val && index < 5) {
    // Sposta il focus al prossimo input
    inputs.value[index + 1].focus()
  }
}

const handleKeyDown = (e, index) => {
  if (e.key === 'Backspace' && !digits.value[index] && index > 0) {
    // Se cancello su un campo vuoto, torno indietro
    inputs.value[index - 1].focus()
  }
  // Gestione INVIO
  if (e.key === 'Enter') {
    const token = digits.value.join('')
    // Parte solo se abbiamo tutti e 6 i caratteri
    if (token.length === 6) {
      emit('submit', token)
    }
  }
}

const handlePaste = (e) => {
  e.preventDefault()
  const pasteData = e.clipboardData.getData('text')
    .replace(/-/g, '') // Rimuove eventuali trattini già presenti
    .toUpperCase()
    .slice(0, 6)
    .split('')

  pasteData.forEach((char, i) => {
    if (i < 6) digits.value[i] = char
  })

  // Focus sull'ultimo elemento riempito o sul sesto
  const nextFocus = Math.min(pasteData.length, 5)
  inputs.value[nextFocus].focus()
}

onMounted(() => {
  // Se al montaggio esiste già un valore (es. dopo un errore), popoliamo i quadratini
  if (props.modelValue && props.modelValue.length === 6) {
    digits.value = props.modelValue.split('')
  }
})

// E aggiungiamo un watch per gestire eventuali reset dall'esterno
watch(() => props.modelValue, (newVal) => {
  if (!newVal) {
    digits.value = ['', '', '', '', '', '']
  } else if (newVal.length === 6 && newVal !== digits.value.join('')) {
    digits.value = newVal.split('')
  }
})

</script>