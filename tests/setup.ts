// tests/setup.ts
// Ambiente comune a tutti i test: variabili d'ambiente fittizie e
// le funzioni globali di h3/Nitro usate dal codice server.
import { createError, defineEventHandler } from 'h3'

// Chiave di test (32 caratteri): non è mai usata fuori dai test
process.env.ENCRYPTION_KEY = 'test-key-0123456789abcdef-012345'

const g = globalThis as any
g.createError = createError
g.defineEventHandler = defineEventHandler
// Versione semplificata di h3.getRequestURL: negli eventi finti dei test basta il path.
// Come h3 (1.15), comprime gli slash iniziali ("//api/..." -> "/api/...").
g.getRequestURL = (event: any) => new URL(event.path.replace(/^[/\\]+/g, '/'), 'http://localhost')
