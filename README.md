# Euganeo Casa

Dashboard privata per monitorare comunicazioni, scadenze, assemblee e documenti del Condominio Euganeo.

## Privacy by design

- Il repository contiene esclusivamente codice: nessuna email, evento, password o token.
- Gmail e Google Calendar sono collegati con permessi **sola lettura**.
- Il server conserva solo metadati utili: oggetto, mittente, data, breve anteprima, numero di allegati e link originale.
- I refresh token Google sono cifrati con AES-256-GCM prima di essere scritti nel database.
- Il database SQLite integrato in Node resta nella cartella locale `data/` e non viene incluso in Git.
- L'app viene eseguita direttamente con Node.js, senza Docker, ed è raggiungibile soltanto tramite la rete privata scelta.

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

### 2. Installa e configura

```bash
npm install
npm run setup
```

La procedura guidata chiede indirizzo privato, password familiare e credenziali OAuth. Genera automaticamente tutte le chiavi di sicurezza e salva `.env`, che è ignorato da Git.

### 3. Avvia

```bash
npm run build
npm start
```

La dashboard ascolta su `http://127.0.0.1:3000`. Per usarla da telefono senza esporla su Internet, collegala a una rete privata come Tailscale Serve e invita esclusivamente i due utenti autorizzati. Il computer o NAS che la esegue deve restare acceso.

## Sviluppo

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Sicurezza

Non committare mai `.env`, `data/`, backup SQLite o esportazioni Gmail. La repository deve restare privata.
