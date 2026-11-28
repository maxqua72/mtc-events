# Documentazione mtc-events

| Documento | Contenuto |
|---|---|
| [primo-avvio.md](primo-avvio.md) | Configurazione da database vuoto: variabili d'ambiente, admin, ASD, documenti legali, manager, soci, cron, push, indici, problemi noti. |
| [accessi-e-autorizzazioni.md](accessi-e-autorizzazioni.md) | Ruoli, come entra ciascuno, sessione, regole di autorizzazione lato server e client, mappa delle pagine. |
| [test.md](test.md) | Come eseguire e scrivere i test automatici (`npm test`). |
| [changelog-1.2.0.md](changelog-1.2.0.md) | Stato degli interventi della 1.2.0 e degli hotfix, con impatto e compatibilità con i dati di produzione. |
| `analisi-mtc-events.md` | Analisi di sicurezza e piano di intervento (documento di lavoro, **solo locale**: escluso da git tramite `.gitignore`). |

Questa cartella è versionata (tranne l'analisi) e viene aggiornata a ogni intervento, nello stesso branch delle modifiche al codice.

## Comandi principali

| Comando | Cosa fa |
|---|---|
| `npm run dev` | Server di sviluppo su `http://localhost:3000`. |
| `npm test` | Test automatici (non richiede MongoDB). |
| `npm run build` | Build di produzione in `.output/`; il `postbuild` crea `build.zip` (solo Windows, PowerShell). |

## Branch

- `main`: produzione (1.1.1). Non si modifica direttamente.
- `release/1.2.0`: integrazione della prossima versione.
- `feat/1.2.0-<nome>`: un intervento, creato da `release/1.2.0` e unito dopo approvazione.
- `hotfix/<versione>-<nome>`: correzioni urgenti da `main`, poi riportate in `release/1.2.0`.
