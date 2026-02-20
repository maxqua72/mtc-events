<template>
  <div class="bg-white rounded-xl p-6 shadow-sm border-2 transition-all hover:shadow-md relative overflow-hidden"
       :class="borderColor">
    
    <div class="flex gap-4 items-center mb-6">
      <div :class="`w-10 h-10 rounded-full flex items-center justify-center border ${iconBgColor}`">
        <Icon :name="icon" size="18" :class="iconTextColor" />
      </div>
      <h4 class="text-xl font-bold text-chess-dark leading-tight">{{ label }}</h4>
        
      <div v-if="trend && false" :class="`px-3 py-1 rounded-full text-[10px] font-bold ${trendClass}`">
        {{ trend }}
      </div>
    </div>

    <div class="mb-2">
      <div >
        <div class="flex justify-between items-end mt-0">
            <span class="text-[11px] text-gray-400 font-medium">{{ subTitle }}</span>
            <span class="text-[11px] text-gray-400 font-medium"
                v-if="subValue !== undefined" >bozze:</span>
        </div>
        
      </div>
      
      
    </div>

    <div class="flex justify-between items-end mt-4">
      <h3 class="text-3xl font-black text-chess-dark leading-none">{{ value }}</h3>
      <div v-if="subValue !== undefined" class="">
        <h3 class="text-3xl font-black text-gray-400 leading-none">{{ subValue }}</h3>
      
        
      </div>
    </div>
    
    <p class="text-[10px] text-gray-300 font-bold uppercase tracking-wider mt-3">
      {{ footerLabel || '' }}
    </p>
  </div>
</template>

<script setup>
const props = defineProps({
  label: String,
  subTitle: String,
  value: [Number, String],
  icon: String,
  color: { type: String, default: 'gray' }, // green, orange, red, gold, blue
  trend: String,
  subValue: [Number, String],
  footerLabel: String
})

const borderColor = computed(() => {
  const maps = {
    green: 'border-green-100',
    orange: 'border-orange-100',
    red: 'border-red-100',
    gold: 'border-yellow-100',
    blue: 'border-blue-100'
  }
  return maps[props.color] || 'border-gray-50'
})

const iconBgColor = computed(() => {
  const maps = {
    green: 'bg-green-50 border-green-100',
    orange: 'bg-orange-50 border-orange-100',
    red: 'bg-red-50 border-red-100',
    gold: 'bg-yellow-50 border-yellow-100',
    blue: 'bg-blue-50 border-blue-100'
  }
  return maps[props.color] || 'bg-gray-50 border-gray-100'
})

const iconTextColor = computed(() => {
  const maps = {
    green: 'text-green-600',
    orange: 'text-orange-500',
    red: 'text-red-600',
    gold: 'text-yellow-600',
    blue: 'text-blue-600'
  }
  return maps[props.color] || 'text-gray-400'
})

const trendClass = computed(() => {
  if (props.color === 'green') return 'bg-green-50 text-green-600'
  if (props.color === 'orange') return 'bg-orange-50 text-orange-600'
  if (props.color === 'red') return 'bg-red-50 text-red-600'
  return 'bg-gray-50 text-gray-400'
})
</script>