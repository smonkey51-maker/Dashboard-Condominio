# Euganeo Casa

Dashboard privata per monitorare comunicazioni, scadenze, assemblee e documenti del Condominio Euganeo.

## Privacy by design

- Il repository contiene esclusivamente codice: nessuna email, evento, password o token.
- Gmail e Google Calendar sono collegati con permessi **sola lettura**.
- Il server conserva solo metadati utili: oggetto, mittente, data, breve anteprima, numero di allegati e link originale.
- I refresh token Google sono cifrati con AES-256-GCM prima di essere scritti nel database.
- Il database SQLite integrato in Node resta nel volume locale `euganeo_data` e non viene incluso in Git.
- L'app è pubblicata soltanto su rete privata; `docker-compose.yml` ascolta su `127.0.0.1`.

## Funzionamento

1. Il proprietario accede con la password familiare.
2. Collega una volta l'account Google dalla dashboard.
3. Il server cerca soltanto le comunicazioni che corrispondono a “Condominio Euganeo” o “Euganeo”.
4. La sincronizzazione parte all'avvio e automaticamente ogni 6 ore.

## Installazione

### 1. Configura Google OAuth

Nel Google Cloud Console crea un client OAuth di tipo **Web application** e abilita Gmail API e Google Calendar API.

URI di reindirizzamento autorizzato:

```text
https://IL-TUO-INDIRIZZO-PRIVATO/api/google/callback
```

Usa esclusivamente gli scope `gmail.readonly` e `calendar.readonly`.

### 2. Crea la configurazione privata

```bash
cp .env.example .env
openssl rand -hex 32   # TOKEN_ENCRYPTION_KEY
openssl rand -base64 32 # SESSION_SECRET e CRON_SECRET
```

Completa `.env` con URL privato e credenziali OAuth. Il file `.env` è ignorato da Git.

### 3. Avvia

```bash
docker compose up -d --build
```

La dashboard ascolta soltanto su `http://127.0.0.1:3000`. Per usarla da telefono senza esporla su Internet, pubblicala tramite una rete privata come Tailscale Serve e invita esclusivamente i due utenti autorizzati.

## Sviluppo

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Sicurezza

Non committare mai `.env`, `data/`, backup SQLite o esportazioni Gmail. Se la repository è stata resa pubblica temporaneamente, può tornare privata subito dopo la creazione del progetto.
