# Euganeo Casa

Dashboard privata e mobile per monitorare pagamenti, assemblee, comunicazioni e documenti del Condominio Euganeo.

## Come funziona

- È pubblicata su Vercel: non servono PC acceso, Docker o server domestici.
- Un Cron Job richiama la sincronizzazione una volta al giorno.
- Gmail e Google Calendar sono usati esclusivamente in sola lettura.
- La dashboard salva soltanto oggetto, mittente, data, breve anteprima, numero di allegati e link originale.
- Stato e refresh token Google sono cifrati con AES-256-GCM prima di essere salvati in un Vercel Blob privato.
- L'accesso alla dashboard è protetto da un account per persona (Nicolò e Jessica), ciascuno con la propria password.

## Configurazione una tantum

### 1. Vercel

Importa questo repository in Vercel, crea un **Blob Store privato** collegato al progetto e aggiungi queste variabili in Production:

```text
APP_URL=https://IL-TUO-PROGETTO.vercel.app
APP_PASSWORD_NICOLO=una-password-lunga-per-nicolo
APP_PASSWORD_JESSICA=una-password-lunga-per-jessica
SESSION_SECRET=almeno-32-caratteri-casuali
CRON_SECRET=un-altro-segreto-lungo
TOKEN_ENCRYPTION_KEY=64-caratteri-esadecimali
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

Il collegamento del Blob Store crea automaticamente `BLOB_READ_WRITE_TOKEN`.

### 2. Google Cloud

Abilita **Gmail API** e **Google Calendar API**, configura la schermata consenso OAuth e crea un client di tipo **Web application**.

URI di reindirizzamento autorizzato:

```text
https://IL-TUO-PROGETTO.vercel.app/api/google/callback
```

### 3. Primo accesso

Apri l'indirizzo Vercel dal telefono, accedi scegliendo il tuo nome e la tua password, poi premi **Collega Google**. Da quel momento la sincronizzazione è automatica una volta al giorno; resta disponibile anche il pulsante **Aggiorna ora**.

## Sviluppo

```bash
npm install
npm run dev
npm run lint
npm run build
```

Usa `.env.example` come riferimento e non committare mai `.env`, token o esportazioni Gmail. Mantieni il repository privato.
