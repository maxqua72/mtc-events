# Accessi e autorizzazioni

Come entrano i diversi utenti, cosa c'è nella sessione e come il server decide chi può fare cosa.
Stato: branch `release/1.2.0`. Le differenze con la produzione (`main`, 1.1.1) sono indicate.

## Ruoli

| Ruolo | Come entra | Credenziali | Cosa può fare |
|---|---|---|---|
| **Visitatore** | Nessun accesso | Nessuna | Consulta ASD ed eventi **pubblicati**. |
| **Socio** | `/<slug>/join` con codice a 6 caratteri, link email o QR | Solo il codice, una volta | Vede la propria tessera; riceve push. Non scrive dati. |
| **Manager** | `/<slug>/join` → «Hai un codice a 9 caratteri?» | Codice manager (collezione `managers`) | Gestisce eventi, generatori, risorse e soci della **sua** ASD. |
| **Admin** | `/login` (1.2.0) oppure `/<slug>/join` → «Hai le credenziali di accesso?» | Username e password (`users.credentials`) | Gestisce tutte le ASD, i manager, i documenti legali. |

## La sessione

È il cookie sigillato `nuxt-session` di nuxt-auth-utils: durata 365 giorni, rinnovato a ogni richiesta (`rolling`).
Viene creato da:

- `POST /api/auth/login` (admin o utente con credenziali);
- `GET /api/asd/{slug}/verify-token` con codice a 9 caratteri (manager).

Contenuto: `{ id, email, is_admin, managed_asds }`.

> **Dalla 1.1.1 il server usa solo `id`.** `is_admin` e `managed_asds` nel cookie servono soltanto all'interfaccia (menu, redirect); i permessi veri vengono riletti dal DB a ogni richiesta.

Il **socio** oggi non ha una sessione server: la sua identità sta nel `localStorage` del dispositivo (`user_data`). Cambierà con l'intervento `member-session`.

**Logout** (1.2.0): `userStore.logout()` chiama `DELETE /api/_auth/session`, che cancella il cookie, e svuota il `localStorage`. Il pulsante di uscita del layout manager riporta a `/<slug>/join`.

## Autorizzazione lato server

File: `server/middleware/auth.ts` (eseguito su ogni richiesta) e `server/utils/auth.ts` (helper).

| Percorso | Controllo | Senza sessione | Sessione senza permesso |
|---|---|---|---|
| `/api/admin/**` | `requireAdmin`: `users.is_admin` vero (anche la stringa `"true"`) | 401 | 403 |
| `/api/manager/{slug}/**` | `requireAsdManager`: admin, oppure documento in `managers` con `user_id` + `association_id` dell'ASD, oppure `users.managed_asds` contiene lo slug (compatibilità con utenti storici) | 401 | 403 |
| `/api/cron/**` | `requireCronSecret` nell'handler (`server/utils/cron-auth.ts`): header `Authorization: Bearer <CRON_SECRET>`, confronto a tempo costante; `rolling` anche `isLocalConnection` | 401 (503 se `CRON_SECRET` manca o ha meno di 16 caratteri) | 403 (`rolling` da un'altra macchina) |
| Tutto il resto | Nessun controllo dal middleware | — | — |

Dettagli:

- L'utente della sessione viene riletto da `users` a ogni richiesta: se è stato cancellato, la risposta è 401.
- **Revoca immediata:** togliere `is_admin` o cancellare il documento in `managers` toglie subito l'accesso alle API, anche con una sessione già aperta.
- Il middleware normalizza il percorso (decodifica, slash doppi, maiuscole) prima del controllo; una codifica non valida dà 400.
- Per le API manager il middleware mette in `event.context.authUser` l'utente e in `event.context.authAsd` l'ASD (null se l'admin usa uno slug inesistente). Le API non li usano ancora: lo faranno con l'intervento `input-validation`.
- L'admin passa anche sulle API manager: serve, ad esempio, per il caricamento del logo da `AsdModal` (`/api/manager/{slug}/resources`).

### API pubbliche con controlli specifici

| API | Comportamento |
|---|---|
| `GET /api/events/{id}` | Evento pubblicato: a tutti. Bozza: solo a manager dell'ASD e admin, agli altri 404. ID non valido: 400. |
| `GET /api/asd/{slug}/search` | Bozze e soci solo per manager dell'ASD e admin; i soci senza token. Testo cercato con escaping. ASD inesistente: 404. |
| `GET /api/auth/permissions` | Solo per l'utente in sessione (401 altrimenti); `?email=` ignorato. |
| `GET /api/admin/users/search` | Solo admin; restituisce id, email, nome, cognome. |

### Cosa NON è ancora protetto

Da risolvere negli interventi successivi della 1.2.0 (vedi [changelog-1.2.0.md](changelog-1.2.0.md)):

- un manager autenticato può agire su eventi, generatori o soci di **un'altra** ASD conoscendone l'ID (le query per ID non filtrano per `association_id`);
- i body delle richieste non sono validati (mass assignment);
- nessun rate limit su login, codici e cambio password;
- `POST /api/auth/update-password` non richiede sessione;
- `POST /api/asd/{slug}/join` registra nell'accettazione dei documenti legali l'IP letto da `X-Forwarded-For`, che il client può falsificare (dato informativo, non un controllo di accesso);
- le API dei soci (`sync-status`, `sync-fcm-token`) lavorano per email e non per sessione.

## Protezione lato client

`app/middleware/02.auth.global.ts` controlla lo store (`userStore.auth`, letto dalla sessione):

- `/admin/**` senza sessione → `/login?redirect=<pagina>` (1.2.0; in 1.1.1 → `/<ultima ASD>/join` o `/`);
- `/<slug>/manager/**` senza sessione → `/<slug>/events`;
- `/<slug>/manager/**` con sessione ma senza quello slug in `managed_asds` e senza `is_admin` → pagina 403 «Permesso negato».

È solo una comodità per l'interfaccia: la protezione vera è quella del server.

### Risposte 401/403 delle API (1.2.0)

Il cookie può ancora dire «admin» o «manager» quando il server ha già tolto il permesso. Il plugin `app/plugins/api-auth-errors.client.ts` intercetta ogni `$fetch`/`useFetch` **nel browser** verso `/api/admin/**` e `/api/manager/**`. La decisione sta in `app/utils/api-auth-errors.ts`, testata.

| Risposta | Cosa succede |
|---|---|
| 401 (sessione non più valida, ad esempio utente cancellato) | Cancella la sessione (`DELETE /api/_auth/session`) e porta a `/login?redirect=<pagina>` dalle pagine admin, a `/<slug>/join` dalle pagine manager, altrimenti a `/login`. |
| 403 (sessione valida, permesso revocato) | Pagina di errore «Permesso negato» con il messaggio del server. La sessione resta. |

Altri errori e le API pubbliche (`/api/auth/login`, `verify-token`...) non vengono toccati. I dati del socio nel `localStorage` restano intatti.

Limiti noti:

- le chiamate fatte durante il rendering lato server (primo caricamento della pagina) non passano dal plugin: la pagina mostra il proprio errore;
- dopo un 403 il cookie dice ancora «admin»/«manager», quindi il menu e il pulsante «Riprendi navigazione» possono riportare alla stessa area, che risponderà di nuovo 403. Si risolve con il registro delle sessioni (`session-registry`).

## Pagine

| Pagina | Chi | Note |
|---|---|---|
| `/` | tutti | Smista: admin → `/admin`, manager → dashboard, socio/visitatore → ultima ASD seguita. |
| `/login` | admin | Login con username e password, anche senza ASD (1.2.0). |
| `/admin`, `/admin/legal` | admin | Gestione ASD e manager; pubblicazione documenti legali. |
| `/<slug>` , `/<slug>/events`, `/<slug>/events/<id>` | tutti | Pagine pubbliche dell'ASD. |
| `/<slug>/join` | soci, manager, admin | Attivazione con codice (6 o 9 caratteri) o credenziali; accettazione documenti legali. |
| `/<slug>/manager/...` | manager dell'ASD, admin | dashboard, events, generators, memberships, resources. |

**Rimosse nella 1.2.0** (`cleanup-legacy`): `/<slug>/auth`, `/<slug>/membership` (accesso socio con la sola email), `/<slug>/join-old`, `/<slug>/join copy`, `/<slug>/events/<id>.old`, e l'API `/api/asd/{slug}/membership`.
In produzione (1.1.1) esistono ancora fino al rilascio della 1.2.0.
