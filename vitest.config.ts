// vitest.config.ts
// Test unitari del codice server, eseguiti in Node senza avviare Nuxt.
// Le funzioni che Nitro rende globali (getDb, getUserSession, createError, ...)
// vengono simulate in tests/setup.ts e nei singoli test.
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    restoreMocks: true
  }
})
