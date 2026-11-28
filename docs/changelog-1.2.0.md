# Changelog e stato degli interventi

Un paragrafo per ogni intervento chiuso: cosa cambia, impatto sugli utenti, **compatibilità con i dati di produzione**, come verificarlo.
Il piano completo e le priorità sono in `analisi-mtc-events.md` (sezioni 7 e 8).

## Stato

| # | Intervento | Branch | Stato |
|---|---|---|---|
| H | Autorizzazione lato server (hotfix) | `hotfix/1.1.1-auth` | ✅ in `main` (1.1.1) e in `release/1.2.0` |
| H2 | Versione 1.1.1 | `hotfix/1.1.1-version` | ✅ in `main` e in `release/1.2.0` |
| — | Login admin su `/login` | `feat/1.2.0-admin-login` | ✅ in `release/1.2.0` |
| 1 | Test automatici | `feat/1.2.0-test-setup` | ✅ in `release/1.2.0` |
| 2 | Pulizia del codice legacy | `feat/1.2.0-cleanup-legacy` | ✅ in `release/1.2.0` |
| 3 | auth-server (cron, 401 lato client) | — | da fare |
| 4 | public-api (proiezioni) | — | da fare |
| 5 | rate-limit e token | — | da fare |
| 6 | log-hygiene | — | da fare |
| 7 | input-validation | — | da fare |
| 8 | public-base-url ed email | — | da fare |
| 9 | uploads e header di sicurezza | — | da fare |
| 10 | member-session | — | da fare |
| 11 | blind-index email | — | da fare |
| 12 | session-registry | — | da fare |
| 13 | rolling-fix | — | da fare |
| 14 | email-queue | — | da fare |
| 15 | asd-lifecycle | — | da fare |
| 16 | fcm-sw | — | da fare |
| 17 | tooling | — | da fare |

---

## H — Autorizzazione lato server (1.1.1)

- Middleware `server/middleware/auth.ts`: `/api/admin/**` solo admin, `/api/manager/{slug}/**` solo manager di quello slug o admin. Ruoli riletti dal DB a ogni richiesta. Dettagli in [accessi-e-autorizzazioni.md](accessi-e-autorizzazioni.md).
- `users/search` e `auth/permissions` non espongono più dati altrui; ricerca e `/api/events/{id}` non mostrano bozze e soci ai visitatori.
- Rimosse le API `admin/associations1`, `admin/managers1`, `asd/{slug}/verify-token copy`.

**Utenti:** visitatori e soci non toccati; manager e admin con sessione valida non devono rientrare.

**Compatibilità con i dati di produzione:** ✅ nessuna migrazione. Funziona con:
- `users.is_admin` booleano **o** stringa `"true"`;
- manager presenti in `managers` (`user_id` e `association_id` come ObjectId) **o** solo nel vecchio `users.managed_asds` (per slug).

⚠️ Un manager che esiste solo come `managed_asds` nel **cookie** ma non nel DB (né in `managers` né in `users.managed_asds`) perde l'accesso alle API: è il comportamento voluto, ma se in produzione ci sono legami salvati solo nel cookie quei manager vanno ricollegati dal pannello admin.

**Verifica:** `/api/admin/associations` in incognito → 401.

## — Login admin su `/login` (1.2.0)

- `/login` riscritta: username e password, nessuna ASD necessaria, gestione del cambio password obbligatorio, `?redirect=` solo interno.
- `/admin` senza sessione → `/login`. Logout del manager: chiude davvero la sessione.

**Compatibilità con i dati di produzione:** ✅ usa gli stessi campi `users.credentials` (`username`, `salt`, `password_hash`) e `must_change_password`.

**Verifica:** [primo-avvio.md](primo-avvio.md), passo 3.

## 1 — Test automatici (1.2.0)

- vitest, `npm test`, 44 test su autorizzazione, middleware e cifratura. Guida: [test.md](test.md).

**Compatibilità con i dati di produzione:** ✅ non tocca il codice dell'app né il DB; solo una dipendenza di sviluppo.

## 2 — Pulizia del codice legacy (1.2.0)

- Rimosse le pagine `/<slug>/join copy`, `/<slug>/join-old`, `/<slug>/events/<id>.old` e i componenti `AppHeader copy.vue`, `DocumentViewer copy.vue` (non usati, ma le pagine erano raggiungibili).
- Rimosso l'accesso socio con la sola email: pagine `/<slug>/auth`, `/<slug>/membership` e API `GET /api/asd/{slug}/membership?email=`, che restituiva l'intero documento del socio (token compresi) a chiunque conoscesse l'email.

**Utenti:** chi avesse un segnalibro su `/<slug>/auth` o `/<slug>/membership` riceve 404. Nessun link nell'app porta lì. Il socio entra da `/<slug>/join`.

**Compatibilità con i dati di produzione:** ✅ nessun dato modificato.
- Le chiavi `auth_<slug>` che quelle pagine avevano salvato nel `localStorage` di qualche dispositivo restano lì inutilizzate e innocue (contengono email e nome del socio sul suo stesso dispositivo); non le legge più nessuno.
- Con i dati attuali quelle pagine trovavano il socio solo nei record con email **in chiaro** (record storici precedenti alla cifratura): proprio quei record erano esposti dall'API rimossa.

**Verifica:** `/<slug>/auth` e `/api/asd/<slug>/membership?email=x` → 404; `/<slug>/events`, `/<slug>/join`, `/login` funzionano.
