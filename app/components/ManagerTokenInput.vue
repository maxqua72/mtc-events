<template>
  <div class="flex flex-col items-center gap-4">
    <div class="flex items-center gap-1.5 sm:gap-2">
      <template v-for="(digit, index) in 3" :key="'b1-' + index">
        <input
          ref="inputs"
          v-model="digits[index]"
          type="text"
          maxlength="1"
          class="w-8 h-12 sm:w-10 sm:h-14 bg-white/5 border-2 border-white/10 rounded-lg text-center text-xl font-mono text-white focus:border-chess-gold outline-none transition-all uppercase"
          @input="handleInput($event, index)"
          @keydown="handleKeyDown($event, index)"
          @paste="handlePaste"
        />
      </template>

      <span class="text-chess-gold/40 font-bold">-</span>

      <template v-for="(digit, index) in 3" :key="'b2-' + index">
        <input
          ref="inputs"
          v-model="digits[index + 3]"
          type="text"
          maxlength="1"
          class="w-8 h-12 sm:w-10 sm:h-14 bg-white/5 border-2 border-white/10 rounded-lg text-center text-xl font-mono text-white focus:border-chess-gold outline-none transition-all uppercase"
          @input="handleInput($event, index + 3)"
          @keydown="handleKeyDown($event, index + 3)"
          @paste="handlePaste"
        />
      </template>

      <span class="text-chess-gold/40 font-bold">-</span>

      <template v-for="(digit, index) in 3" :key="'b3-' + index">
        <input
          ref="inputs"
          v-model="digits[index + 6]"
          type="text"
          maxlength="1"
          class="w-8 h-12 sm:w-10 sm:h-14 bg-white/5 border-2 border-white/10 rounded-lg text-center text-xl font-mono text-white focus:border-chess-gold outline-none transition-all uppercase"
          @input="handleInput($event, index + 6)"
          @keydown="handleKeyDown($event, index + 6)"
          @paste="handlePaste"
        />
      </template>
    </div>
  </div>
</template>

<script setup>
const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue', 'submit'])

const digits = ref(Array(9).fill(''))
const inputs = ref([])

watch(digits, (newVal) => {
  const token = newVal.join('').toUpperCase()
  emit('update:modelValue', token)
}, { deep: true })

const handleInput = (e, index) => {
  if (e.target.value && index < 8) {
    inputs.value[index + 1].focus()
  }
}

const handleKeyDown = (e, index) => {
  if (e.key === 'Backspace' && !digits.value[index] && index > 0) {
    inputs.value[index - 1].focus()
  }
  if (e.key === 'Enter' && digits.value.join('').length === 9) {
    emit('submit', digits.value.join(''))
  }
}

const handlePaste = (e) => {
  e.preventDefault()
  const pasteData = e.clipboardData.getData('text')
    .replace(/-/g, '') // Rimuove eventuali trattini già presenti
    .toUpperCase()
    .slice(0, 9)
    .split('')

  pasteData.forEach((char, i) => {
    if (i < 9) digits.value[i] = char
  })

  // Focus sull'ultimo elemento riempito o sul sesto
  const nextFocus = Math.min(pasteData.length, 5)
  inputs.value[nextFocus].focus()
}

watch(() => props.modelValue, (newVal) => {
  if (!newVal) digits.value = Array(9).fill('')
})

onMounted(() => {
  // Se al montaggio esiste già un valore (es. dopo un errore), popoliamo i quadratini
  if (props.modelValue && props.modelValue.length === 9) {
    digits.value = props.modelValue.split('')
  }
})
</script>