<template>
    <div
        class="bg-chess-pearl border border-gray-200 rounded-xl overflow-hidden transition-all hover:shadow-xl group flex flex-col h-full min-h-[180px] relative">
        <div class="p-5 flex gap-3">
            <div
                class="w-20 h-20 shrink-0 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden p-2">
                <img v-if="asd.logo_url" :src="asd.logo_url" class="w-full h-full object-contain" />
                <Icon v-else name="fa6-solid:chess-knight" size="24" class="text-gray-200" />
            </div>

            <div class="flex-1 min-w-0 py-2 pl-4">
                <p class="text-[10px] font-black text-chess-chocolate tracking-[0.2em] mb-1 uppercase">
                    Associazione Sportiva
                </p>
                <h3
                    class="text-xl font-bold text-chess-dark leading-tight group-hover:text-chess-brown transition-colors line-clamp-1">
                    {{ asd.name }}
                </h3>
                <p class="text-[12px] font-mono font-bold text-gray-400 mt-1 lowercase tracking-widest">
                    /{{ asd.slug.toLowerCase() }}
                </p>
            </div>
        </div>

        <div class="px-5 pb-4 flex-1 flex flex-col">
            <div class="flex justify-between items-center mb-3">
                <p class="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                    Elenco Manager
                </p>
                <button @click.prevent="$emit('add-manager', asd)"
                    class="bg-chess-dark text-chess-gold px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider hover:scale-105 transition-all shadow-sm flex items-center gap-1.5">
                    <Icon name="fa6-solid:user-plus" size="10" />
                    <span>Manager</span>
                </button>
            </div>

            <div class="flex flex-wrap gap-2">
                <template v-if="asd.managers && asd.managers.length > 0">
                    <div v-for="manager in asd.managers" :key="manager.email"
                        class="flex items-center gap-2 bg-white text-chess-dark px-3 py-1 rounded-lg border border-gray-200 shadow-sm group/m relative"
                        :title="`Contatta: ${manager.email}`">

                        <div class="flex flex-col">
                            <div class="flex items-center gap-2">
                                <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                <span class="text-[12px] font-bold leading-none">{{ manager.name }}</span>
                            </div>


                            <span class="text-[11px] text-gray-400 font-mono mt-0.5">{{ manager.email }}</span>
                        </div>

                        <button @click.prevent="$emit('remove-manager', asd._id, manager.email)"
                            class="ml-1 text-gray-300 hover:text-red-500 transition-colors">
                            <Icon name="fa6-solid:xmark" size="10" />
                        </button>
                    </div>
                </template>

                <p v-else class="text-[10px] italic text-gray-300">Nessun manager configurato</p>
            </div>
        </div>

        <div class="px-5 py-4 border-t border-gray-50 bg-gray-50/30 flex justify-between items-center">
            <NuxtLink :to="`/${asd.slug}/manager/events`"
                class="flex items-center gap-2 text-gray-500 hover:text-chess-gold transition-colors w-fit">
                <Icon name="fa6-solid:gears" size="14" class="opacity-50" />
                <span
                    class="underline underline-offset-4 decoration-gray-300 uppercase text-[10px] font-black tracking-widest">
                    Apri Dashboard ASD
                </span>
            </NuxtLink>
        </div>

        <div class="absolute bottom-3 right-4 flex gap-2">
            <button @click="$emit('edit', asd)"
                class="w-10 h-10 bg-white shadow-xl rounded-full flex items-center justify-center text-chess-dark hover:text-chess-gold transition-all border border-gray-100"
                title="Modifica">
                <Icon name="fa6-solid:pen" size="14" />
            </button>

            <button @click="$emit('delete', asd._id)"
                class="w-10 h-10 bg-white shadow-xl rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-all border border-gray-100"
                title="Elimina">
                <Icon name="fa6-solid:trash-can" size="14" />
            </button>
        </div>
    </div>
</template>

<script setup>
defineProps(['asd'])
defineEmits(['edit', 'delete', 'add-manager', 'remove-manager'])
</script>