# Test automatici

Introdotti nella 1.2.0 con l'intervento `feat/1.2.0-test-setup`. Su `main` (1.1.1) non ci sono test.

## Eseguire i test

```powershell
npm install
```

```powershell
npm test
```

| Comando | Cosa fa |
|---|---|
| `npm test` | Esegue tutti i test una volta (`vitest run`). Esce con codice diverso da 0 se un test fallisce: adatto a CI e pre-commit. |
| `npm run test:watch` | Riesegue i test a ogni modifica dei file (`vitest`). |
| `npx vitest run tests/server/auth.test.ts` | Esegue un solo file. |
| `npx vitest run -t "admin"` | Esegue solo i test il cui nome contiene «admin». |

**Non servono** MongoDB, il server Nuxt avviato né un file `.env`: i test girano in Node puro, con dati in memoria.

Prima di ogni merge in `release/1.2.0` devono passare sia `npm test` sia `npm run build`.

## Struttura

```
vitest.config.ts            configurazione (ambiente node, file tests/**/*.test.ts)
tests/
  setup.ts                  ambiente comune: ENCRYPTION_KEY di test, funzioni globali h3/Nitro
  helpers/
    fake-db.ts              DB in memoria minimo (findOne con filtri di uguaglianza) ed evento h3 finto
  server/
    auth.test.ts            helper di autorizzazione (server/utils/auth.ts)
    auth-middleware.test.ts middleware server/middleware/auth.ts
    crypto-utils.test.ts    cifratura, mascheramento, hash password (server/utils/crypto-utils.ts)
```

## Come funzionano le simulazioni

Nitro rende **globali** alcune funzioni (auto-import): `getDb`, `getUserSession`, `createError`, `defineEventHandler`, `getRequestURL` e tutte le funzioni esportate da `server/utils/*`. Il codice server le usa senza `import`, quindi nei test vanno definite su `globalThis`:

- `tests/setup.ts` definisce una volta per tutte `createError` e `defineEventHandler` (quelli veri di h3) e una versione semplificata di `getRequestURL` che, come h3 1.15, comprime gli slash iniziali (`//api/...` → `/api/...`).
- Nei singoli test si usa `vi.stubGlobal(...)` per `getDb` (con `createFakeDb`) e `getUserSession` (utente della sessione a scelta). `restoreMocks: true` in `vitest.config.ts` ripulisce i mock tra un test e l'altro.
- `ENCRYPTION_KEY` di test è impostata in `tests/setup.ts` **prima** che venga importato `crypto-utils.ts`, che la legge al caricamento.

`createFakeDb` supporta solo `collection(nome).findOne(filtro)` con uguaglianza semplice; gli `ObjectId` sono confrontati come stringhe. Se un nuovo test ha bisogno di altro (`find`, `aggregate`, operatori `$in`...), estendere l'helper oppure valutare `mongodb-memory-server` (MongoDB reale in memoria, non ancora installato).

## Cosa è coperto

| File | Copertura |
|---|---|
| `auth.test.ts` (17 test) | 401 senza sessione, id di sessione non valido, utente cancellato dal DB; admin anche con `is_admin: "true"` stringa; manager della propria ASD sì, di un'altra no; manager storici con `users.managed_asds`; ruoli falsificati nel cookie (`is_admin`, `managed_asds`) ignorati; admin su slug inesistente. |
| `auth-middleware.test.ts` (20 test) | Percorsi `/api/admin/**` e `/api/manager/{slug}/**` protetti, anche con slash doppi, maiuscole, caratteri codificati (`%61dmin`); percorsi pubblici non toccati (`/api/administrator`, `/api/managers`, API pubbliche); 400 su codifica non valida; propagazione degli errori. |
| `crypto-utils.test.ts` (7 test) | encrypt/decrypt reversibili, IV casuale, formato `iv:tag:testo`, dati in chiaro passano invariati, dato manomesso rifiutato, mascheramento email/cognome, hash password compatibile con il login. |

**Non coperto (ancora):** le singole API, le pagine Vue, il flusso completo con un DB reale. Ogni intervento successivo aggiunge i test per il codice che modifica.

## Aggiungere un test

1. Creare `tests/server/<nome>.test.ts` (o `tests/<area>/...`).
2. Importare il modulo da testare con un percorso relativo (`../../server/utils/...`).
3. Simulare con `vi.stubGlobal` le funzioni globali che il modulo usa.
4. Eseguire `npm test`.

Verifica che un test serva davvero: introdurre di proposito l'errore che il test dovrebbe intercettare (ad esempio togliere il controllo `isAdminFlag` in `requireAdmin`) e controllare che fallisca.
