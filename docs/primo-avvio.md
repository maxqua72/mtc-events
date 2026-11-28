# mtc-events: primo avvio da database vuoto

Questa guida configura un'istanza di mtc-events partendo da un MongoDB vuoto, fino al primo socio attivo.
Vale per l'ambiente locale di test e, con le avvertenze indicate, anche per una nuova installazione.

Fa riferimento al branch `release/1.2.0` (in sviluppo); dove la produzione (1.1.1, branch `main`) si comporta diversamente è indicato.
Gli interventi ancora da fare (sessioni con revoca, ecc.) cambieranno alcuni passi: la guida viene aggiornata con ciascuno di essi.

Documenti collegati: [README](README.md) (indice), [accessi-e-autorizzazioni.md](accessi-e-autorizzazioni.md), [test.md](test.md), [changelog-1.2.0.md](changelog-1.2.0.md).

## Indice

0. [Prerequisiti e variabili d'ambiente](#0-prerequisiti-e-variabili-dambiente)
1. [Creazione del profilo admin](#1-creazione-del-profilo-admin)
2. [Creazione della prima ASD (bootstrap)](#2-creazione-della-prima-asd-bootstrap)
3. [Primo accesso come admin](#3-primo-accesso-come-admin)
4. [Pubblicazione dei documenti legali](#4-pubblicazione-dei-documenti-legali)
5. [Configurazione dell'ASD e nomina del manager](#5-configurazione-dellasd-e-nomina-del-manager)
6. [Primo accesso del manager](#6-primo-accesso-del-manager)
7. [Eventi, generatori e soci](#7-eventi-generatori-e-soci)
8. [Attività pianificate (cron)](#8-attività-pianificate-cron)
9. [Notifiche push (opzionale)](#9-notifiche-push-opzionale)
10. [Indici consigliati (opzionale)](#10-indici-consigliati-opzionale)
11. [Problemi noti durante il primo avvio](#11-problemi-noti-durante-il-primo-avvio)

---

## 0. Prerequisiti e variabili d'ambiente

Servono:

- Node.js, una versione compatibile con Nuxt 4;
- un'istanza MongoDB raggiungibile;
- `mongosh`, oppure la shell integrata di MongoDB Compass;
- facoltativo: un account Resend per le email e un progetto Firebase per le push.

Installa le dipendenze:

```powershell
npm install
```

### Variabili d'ambiente

Si mettono in `.env` (o `.env.local`), nella root del progetto. Il file non va mai committato.

| Variabile | Obbligatoria | Contenuto |
|---|---|---|
| `MONGODB_URI` | sì | URI di connessione, ad esempio `mongodb://127.0.0.1:27017`. Senza questa variabile il server usa `mongodb://0.0.0.0:27017/mtc_events`. |
| `ENCRYPTION_KEY` | sì | **Esattamente 32 caratteri.** Cifra email e cognomi dei soci (AES-256-GCM). Senza questa variabile il server non parte. |
| `NUXT_SESSION_PASSWORD` | sì | Almeno 32 caratteri. Sigilla il cookie di sessione `nuxt-session`. |
| `CRON_SECRET` | sì | Segreto che protegge gli endpoint `/api/cron/*`. |
| `RESEND_API_KEY` | per le email | Chiave API di Resend. |
| `RESEND_TEST_RECIPIENT` | in sviluppo | Fuori produzione **tutte** le email vengono deviate su questo indirizzo. |
| `FIREBASE_SERVICE_ACCOUNT` | per le push | JSON del service account Firebase, su una sola riga. |
| `NUXT_PUBLIC_FIREBASE_*` | per le push | `API_KEY`, `AUTH_DOMAIN`, `PROJECT_ID`, `MESSAGING_SENDER_ID`, `APP_ID`, `VAPID_KEY`. |

> **Nome del database.** Il codice usa sempre il database `mtcevents` (`server/utils/db.ts:12`) e ignora il nome eventualmente scritto nell'URI.
> Tutte le operazioni in mongosh di questa guida vanno quindi fatte dopo `use mtcevents`.

### Generare i segreti

Ognuno di questi comandi stampa un valore casuale:

```powershell
node -e "console.log(require('node:crypto').randomBytes(16).toString('hex'))"
```

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

- **`ENCRYPTION_KEY`**: usa il primo comando, che produce 32 caratteri esadecimali.
- **`NUXT_SESSION_PASSWORD`** e **`CRON_SECRET`**: usa il secondo, che produce 64 caratteri.

> ⚠️ `ENCRYPTION_KEY` non si può cambiare dopo aver inserito dei soci: i dati cifrati con la vecchia chiave diventerebbero illeggibili.
> Conservala in un posto sicuro, separata dai backup del database.

### Avvio

```powershell
npm run dev
```

L'app risponde su `http://localhost:3000`. Le collezioni MongoDB vengono create da sole alla prima scrittura: non c'è nessuno schema da inizializzare.

Per i test automatici (`npm test`) non servono né MongoDB né il server avviato: vedi [test.md](test.md).

---

## 1. Creazione del profilo admin

Nessun endpoint e nessuna pagina crea un admin: va inserito direttamente nel database.

### 1.1 Formato atteso dal login

Il login (`server/api/auth/login.post.ts`) cerca in `users` un documento con questi campi:

- `credentials.username`: lo username con cui si accede;
- `credentials.salt`: 16 byte casuali in esadecimale, cioè 32 caratteri;
- `credentials.password_hash`: `scrypt(password, salt, 64)` in esadecimale, cioè 128 caratteri.

Lo stesso algoritmo è in `hashInternalPassword` (`server/utils/crypto-utils.ts`).

> Attenzione: come salt si usa **la stringa esadecimale**, non i byte che rappresenta.

### 1.2 Generare salt e hash

Lancia questo comando dalla root del progetto. Chiede la password in modo interattivo, così non finisce nella cronologia della shell. Mentre la digiti, però, è visibile.

```powershell
node -e "const c=require('node:crypto');const rl=require('node:readline').createInterface({input:process.stdin,output:process.stdout});rl.question('Password: ',p=>{rl.close();const s=c.randomBytes(16).toString('hex');console.log(JSON.stringify({salt:s,password_hash:c.scryptSync(p,s,64).toString('hex')}))})"
```

L'output è una riga di questo tipo: `{"salt":"…","password_hash":"…"}`.

Scegli una password robusta, di almeno 12 caratteri. Oggi il server non applica né una policy sulle password né un limite ai tentativi.

### 1.3 Inserire l'admin

In mongosh:

```js
use mtcevents

// Verifica che lo username sia libero
db.users.findOne({ "credentials.username": "admin" })

db.users.insertOne({
  email: "admin@example.org",        // minuscolo; in `users` l'email è salvata in chiaro
  name: "Nome",
  surname: "Cognome",
  is_admin: true,                     // booleano, non la stringa "true"
  must_change_password: false,        // vedi la nota sotto
  credentials: {
    username: "admin",
    salt: "<salt dal passo 1.2>",
    password_hash: "<password_hash dal passo 1.2>"
  },
  managed_asds: [],
  created_at: new Date()
})
```

> **Perché `must_change_password: false`.** Il flusso di cambio password obbligatorio oggi è rotto: in `join.vue`, `confirmPasswordChange` chiama `userStore.setAuth`, che non esiste.
> La password cambia, ma l'utente vede un errore e non ottiene una sessione. Si sistema nella 1.2.0.

### 1.4 Reimpostare la password più avanti

Genera un nuovo salt e un nuovo hash come al passo 1.2, poi:

```js
db.users.updateOne(
  { "credentials.username": "admin" },
  { $set: {
      "credentials.salt": "<nuovo salt>",
      "credentials.password_hash": "<nuovo hash>",
      must_change_password: false,
      updated_at: new Date()
  } }
)
```

> **Rimozione di `is_admin`:** dalla 1.1.1 ha effetto subito sulle API, perché il server rilegge il ruolo dal DB a ogni richiesta.
> **Cambio di password:** una sessione già aperta resta valida (il cookie dura 365 giorni) finché non viene cancellato il cookie `nuxt-session` dal browser. La revoca delle sessioni arriva con l'intervento `session-registry`.

---

## 2. Creazione della prima ASD (bootstrap)

> **Dalla 1.2.0 (branch `feat/1.2.0-admin-login`) questo passo non serve più:** l'admin entra da `/login` anche senza ASD e crea la prima dal pannello `/admin`.
> Resta necessario solo sulla versione 1.1.x, dove il form di login dell'admin esiste solo nella pagina `/<slug>/join`, che risponde 404 se l'ASD non esiste.

Su 1.1.x, quindi, **la prima ASD va creata a mano**. Le successive si creano dall'interfaccia admin.

Usa lo stesso formato di `server/api/admin/associations/index.post.ts`:

```js
use mtcevents

db.associations.insertOne({
  name: "Circolo Scacchi Esempio",
  slug: "circolo-esempio",          // minuscolo, senza spazi: diventa l'URL /circolo-esempio
  theme_color: "#3b82f6",
  logo_url: null,
  created_at: new Date(),
  updated_at: new Date()
})
```

Può essere la vera prima ASD oppure un'ASD tecnica da rimuovere in seguito. Logo e altri dati si completano dopo, dal pannello admin.

---

## 3. Primo accesso come admin

**Dalla 1.2.0:** apri `http://localhost:3000/login`, inserisci username e password e clicca **Accedi**. Arrivi su `/admin`.
Anche aprire `/admin` senza sessione rimanda a `/login`. Se l'utente ha `must_change_password: true`, la pagina chiede la nuova password e poi completa l'accesso.

**Su 1.1.x:**

1. Apri `http://localhost:3000/circolo-esempio/join`.
2. Clicca **«Hai un codice a 9 caratteri?»**.
3. Clicca **«Hai le credenziali di accesso?»**.
4. Inserisci username e password del passo 1, poi clicca **Accedi**.
5. Il server imposta il cookie `nuxt-session` e reindirizza a `/circolo-esempio/events`.
6. Apri `http://localhost:3000/admin`, oppure `http://localhost:3000/`, che reindirizza l'admin su `/admin`.

Se l'accesso fallisce, controlla:

- che `is_admin` sia il booleano `true`;
- che lo username coincida esattamente, maiuscole e minuscole comprese;
- che hash e salt siano stati copiati per intero (128 e 32 caratteri).

---

## 4. Pubblicazione dei documenti legali

**Va fatto prima di invitare manager o soci.** Durante l'attivazione con codice, la pagina `join` legge `terms`, `privacy` e `cookies` da `/api/legal/active-docs`. Se mancano, va in errore al momento dell'accettazione (`join.vue:367-376`).

I file sono già nel repository, in `public/legal/<tipo>/<tipo>_v1_0.pdf` e `.html`, per tutti e tre i tipi.

1. Dal pannello admin apri la pagina **Legal**: `http://localhost:3000/admin/legal`.
2. Sincronizza i tre documenti, `terms`, `privacy` e `cookies`, con versione `1.0`.
3. Per ciascuno il server calcola l'hash SHA-256 del PDF, salva l'HTML in `legal_documents` e disattiva le versioni precedenti dello stesso tipo.

Verifica:

```js
db.legal_documents.find({ is_active: true }, { type: 1, version: 1, hash: 1 })
```

Devi trovare tre documenti attivi.

**Pubblicare una nuova versione.** Aggiungi in `public/legal/<tipo>/` i file `<tipo>_v1_1.pdf` e `<tipo>_v1_1.html`, poi sincronizza con versione `1.1`.

---

## 5. Configurazione dell'ASD e nomina del manager

Dal pannello `/admin`:

1. **Completa l'ASD** creata al passo 2: logo, colore, nome. Da qui puoi anche creare altre ASD.
2. **Aggiungi un manager** all'ASD con nome, cognome ed email:
   - se l'email non esiste ancora, viene creato un utente in `users` con `is_admin: false`;
   - in `managers` viene creato il legame utente–ASD, con un `manager_token` di 9 caratteri.
3. **Invia l'invito**. L'email contiene il codice nel formato `XXX-XXX-XXX` e il link `/<slug>/join`.

### Email in sviluppo

Fuori produzione (`NODE_ENV !== 'production'`):

- il mittente è `onboarding@resend.dev`;
- il destinatario è sempre `RESEND_TEST_RECIPIENT`.

Con il piano gratuito di Resend, questo indirizzo deve essere quello dell'account Resend.

### Senza Resend

L'email resta comunque nella coda, e il codice si può leggere dal database:

```js
db.email_queue.find({ type: "manager_invite" }).sort({ created_at: -1 }).limit(1)
db.managers.find({}, { user_id: 1, association_id: 1, manager_token: 1 })
```

> In produzione il mittente è `"<nome ASD>" <sistema@events.mindthecheck.com>`: il dominio deve essere verificato su Resend.
> I limiti di invio sono fissati nel codice, a 90 email al giorno e 2800 al mese (`server/utils/email-engine.ts`). Oltre questi limiti le email restano in coda per il giorno o il mese successivo.

---

## 6. Primo accesso del manager

1. Apri `/<slug>/join`, poi clicca **«Hai un codice a 9 caratteri?»**.
2. Inserisci il codice manager e accetta i documenti legali.
3. Il server crea la sessione e il manager raggiunge `/<slug>/manager/dashboard`.

Il manager non ha username e password: entra solo con il codice. Se lo perde, l'admin può rigenerarlo e reinviarlo dal pannello.

> Per provare da solo entrambi i ruoli, usa due profili del browser, oppure una finestra in incognito. Il cookie di sessione è uno solo per browser: un nuovo accesso sostituisce quello precedente.

---

## 7. Eventi, generatori e soci

Tutte queste operazioni si fanno dalla dashboard del manager, `/<slug>/manager/…`.

- **Risorse** (`resources`): carica immagini e locandine, che vengono salvate in GridFS.
- **Eventi** (`events`): crea un evento e pubblicalo. Gli eventi pubblicati sono visibili a tutti, senza login, su `/<slug>/events`.
- **Generatori** (`generators`): modelli di eventi ricorrenti, che il task `rolling` trasforma in eventi (vedi il passo 8).
- **Soci** (`memberships`): inserisci nome, cognome ed email. Email e cognome vengono cifrati con `ENCRYPTION_KEY`.
  - Con **Invia invito**, il socio riceve un'email con un codice di 6 caratteri, il link e il QR.
  - In sviluppo l'email arriva comunque a `RESEND_TEST_RECIPIENT`.

**Attivazione del socio.** Il socio apre `/<slug>/join` (oppure il link o il QR), inserisce il codice di 6 caratteri e accetta i documenti legali. Non crea credenziali.

> Il codice di un socio si legge anche dal database (`db.memberships.find({}, { short_token: 1, join_token: 1 })`). Email e cognome lì appaiono cifrati, ed è normale.

---

## 8. Attività pianificate (cron)

L'app non pianifica nulla da sola: i task Nitro vanno richiamati dall'esterno.

| Endpoint | Task | Frequenza consigliata | Vincoli |
|---|---|---|---|
| `GET /api/cron/flush-email` | `email/flush`: invia le email rimaste in coda | ogni 15–60 minuti | header `Authorization: Bearer <CRON_SECRET>` |
| `GET /api/cron/rolling` | `generators/rolling`: genera gli eventi dei generatori | una volta per notte | stesso header; **solo da localhost** |

Lancio manuale in locale, da PowerShell:

```powershell
$h = @{ Authorization = "Bearer $env:CRON_SECRET" }; Invoke-RestMethod -Uri http://localhost:3000/api/cron/flush-email -Headers $h
```

```powershell
$h = @{ Authorization = "Bearer $env:CRON_SECRET" }; Invoke-RestMethod -Uri http://localhost:3000/api/cron/rolling -Headers $h
```

`$env:CRON_SECRET` va impostato nella sessione PowerShell con lo stesso valore di `.env`.

In produzione si usa lo scheduler del server, ad esempio Task Scheduler o cron, che chiama gli stessi URL dalla stessa macchina.

> ⚠️ Assicurati che `CRON_SECRET` sia sempre impostato. Oggi, se manca, il controllo accetta l'header letterale `Bearer undefined`. Si corregge nella 1.2.0.

---

## 9. Notifiche push (opzionale)

1. Crea un progetto su Firebase e aggiungi una Web App.
2. Copia la configurazione nelle variabili `NUXT_PUBLIC_FIREBASE_*`.
3. Genera la chiave VAPID in *Cloud Messaging → Web Push certificates* e mettila in `NUXT_PUBLIC_FIREBASE_VAPID_KEY`.
4. Genera un service account (*Impostazioni progetto → Account di servizio*) e mettine il JSON, su una sola riga, in `FIREBASE_SERVICE_ACCOUNT`.

Note:

- usa progetti Firebase separati per sviluppo e produzione;
- in sviluppo il PWA plugin è disattivato (`pwa.disable: process.dev`), quindi l'esperienza da app installata va provata con `npm run build` seguito da `npm run preview`;
- le push ai soci oggi non funzionano per un bug noto (vedi il punto 11).

---

## 10. Indici consigliati (opzionale)

Il codice oggi non crea indici. Su un database vuoto si possono aggiungere subito, senza rischio di conflitti:

```js
use mtcevents
db.associations.createIndex({ slug: 1 }, { unique: true })
db.users.createIndex(
  { "credentials.username": 1 },
  { unique: true, partialFilterExpression: { "credentials.username": { $exists: true } } }
)
db.managers.createIndex({ user_id: 1, association_id: 1 }, { unique: true })
db.managers.createIndex({ manager_token: 1 })
db.events.createIndex({ association_id: 1, start_date: 1 })
db.memberships.createIndex({ association_id: 1 })
db.email_queue.createIndex({ status: 1, priority: 1, scheduled_at: 1 })
```

> Su un database di produzione già popolato, gli indici `unique` vanno creati solo dopo aver controllato che non ci siano duplicati.

---

## 11. Problemi noti durante il primo avvio

Tutti questi problemi sono documentati nell'analisi. Quelli ancora aperti verranno risolti nella 1.2.0; per lo stato aggiornato vedi [changelog-1.2.0.md](changelog-1.2.0.md).

| Sintomo | Causa |
|---|---|
| `/<slug>/join` risponde 404 con il database vuoto | Su 1.1.x il login dell'admin è solo nella pagina `join` di un'ASD: vedi il passo 2. Dalla 1.2.0 usa `/login`. |
| Login con errore «Errore di connessione», e nel log del server `Command find requires authentication` | MongoDB ha l'autenticazione attiva, ma `MONGODB_URI` non contiene utente e password: usa `mongodb://utente:password@host:27017/?authSource=admin`. |
| Errore all'attivazione di un manager o di un socio | Mancano i documenti legali attivi: vedi il passo 4. |
| Dopo il cambio password obbligatorio, da `/<slug>/join`, non si resta connessi | Il server non apre una sessione dopo `update-password`: vedi il passo 1.3. Da `/login` (1.2.0) funziona. |
| Il socio perde la tessera quando riapre l'app | `verify-token` salva l'email mascherata e `sync-status` non trova più il socio. |
| Le push ai soci non arrivano | Stessa causa: il token FCM viene inviato insieme all'email mascherata. |
| `/<slug>/auth` e `/<slug>/membership` rispondono 404 | Pagine legacy rimosse in 1.2.0 (`cleanup-legacy`): il socio entra solo da `/<slug>/join`. In produzione (1.1.1) esistono ancora ma non vanno usate, come il vecchio `/login`. |
| Un admin o un manager entrato con username e password vede «Permesso negato» sulle pagine `/<slug>/manager/...` | Il login con credenziali mette nella sessione le ASD dal vecchio campo `users.managed_asds`, non dalla collezione `managers`. I manager entrano con il codice a 9 caratteri; l'admin non ha questo problema. |
| Il server stampa email e sessioni nei log | Log di debug da eliminare: non condividere i log. |
| Le API admin e manager rispondono 401/403 | Comportamento corretto dalla 1.1.1: serve una sessione con il ruolo giusto, vedi [accessi-e-autorizzazioni.md](accessi-e-autorizzazioni.md). Restano altri punti aperti (rate limit, validazione dei dati): **non esporre un'istanza di test su Internet.** |
