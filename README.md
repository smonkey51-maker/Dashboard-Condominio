# Euganeo Casa

Dashboard privata e mobile per monitorare pagamenti, assemblee, comunicazioni e documenti del Condominio Euganeo.

## Come funziona

- È pubblicata su Vercel: non servono PC acceso, Docker o server domestici.
- Un Cron Job richiama la sincronizzazione una volta al giorno.
- Gmail e Google Calendar sono usati esclusivamente in sola lettura.
- La dashboard salva soltanto oggetto, mittente, data, breve anteprima, numero di allegati e link originale.
- Stato e refresh token Google sono cifrati con AES-256-GCM prima di essere salvati in un Vercel Blob privato.
- L'accesso alla dashboard avviene con **Accedi con Google**: solo i due account Google autorizzati (Nicolò e Jessica) possono entrare, niente password da ricordare.

## Configurazione una tantum

### 1. Vercel

Importa questo repository in Vercel, crea un **Blob Store privato** collegato al progetto e aggiungi queste variabili in Production:

```text
APP_URL=https://IL-TUO-PROGETTO.vercel.app
GOOGLE_LOGIN_EMAIL_NICOLO=email-google-di-nicolo@gmail.com
GOOGLE_LOGIN_EMAIL_JESSICA=email-google-di-jessica@gmail.com
SESSION_SECRET=almeno-32-caratteri-casuali
CRON_SECRET=un-altro-segreto-lungo
TOKEN_ENCRYPTION_KEY=64-caratteri-esadecimali
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

Il collegamento del Blob Store crea automaticamente `BLOB_READ_WRITE_TOKEN`.

### 2. Google Cloud

Abilita **Gmail API** e **Google Calendar API**, configura la schermata consenso OAuth e crea un client di tipo **Web application**.

URI di reindirizzamento autorizzati (servono entrambi: uno per il login, uno per collegare Gmail/Calendar):

```text
https://IL-TUO-PROGETTO.vercel.app/api/auth/google/callback
https://IL-TUO-PROGETTO.vercel.app/api/google/callback
```

### 3. Primo accesso

Apri l'indirizzo Vercel dal telefono, premi **Accedi con Google** e scegli il tuo account (deve corrispondere a una delle email autorizzate), poi premi **Collega Google** per attivare la sincronizzazione. Da quel momento la sincronizzazione è automatica una volta al giorno; resta disponibile anche il pulsante **Aggiorna ora**.

## Sviluppo

```bash
npm install
npm run dev
npm run lint
npm run build
```

Usa `.env.example` come riferimento e non committare mai `.env`, token o esportazioni Gmail. Mantieni il repository privato.
