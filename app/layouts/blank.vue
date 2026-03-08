<template>
  <div class="min-h-svh bg-chess-dark">
    <slot />
  </div>
</template>

<style scoped>
/* Assicuriamoci che il body non abbia margini strani quando questo layout è attivo */
:deep(body) {
  margin: 0;
  padding: 0;
  background-color: #1a1a1a;
}
</style>