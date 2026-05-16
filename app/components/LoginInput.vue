<template>
  <div class="w-full space-y-3 animate-in zoom-in-95 duration-300">
    <div class="space-y-2">
      <div class="relative group">
        <div class="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-chess-gold transition-colors">
          <Icon name="fa6-solid:user" size="14" />
        </div>
        <input 
          ref="usernameRef"
          v-model="modelValue.username" 
          type="text" 
          placeholder="USERNAME"
          :disabled="disabled"
          class="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white font-black tracking-widest outline-none focus:border-chess-gold focus:bg-white/10 transition-all placeholder:text-white/10 text-sm"
          @keydown.enter="focusPassword"
        />
      </div>

      <div class="relative group">
        <div class="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-chess-gold transition-colors">
          <Icon name="fa6-solid:key" size="14" />
        </div>
        <input 
          ref="passwordRef"
          v-model="modelValue.password" 
          type="password" 
          placeholder="PASSWORD"
          :disabled="disabled"
          class="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white font-black tracking-widest outline-none focus:border-chess-gold focus:bg-white/10 transition-all placeholder:text-white/10 text-sm"
          @keydown.enter="$emit('submit')"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true // Deve essere { username: '', password: '' }
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'submit'])

const usernameRef = ref(null)
const passwordRef = ref(null)

const focusPassword = () => {
  passwordRef.value?.focus()
}

// Focus automatico sul primo campo al montaggio
onMounted(() => {
  setTimeout(() => usernameRef.value?.focus(), 100)
})
</script>