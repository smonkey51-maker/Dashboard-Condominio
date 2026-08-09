import { createInterface } from "node:readline/promises";
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { stdin as input, stdout as output } from "node:process";

if (existsSync(".env")) {
  console.error("Il file .env esiste già. Rinominalo se vuoi ripetere la configurazione.");
  process.exit(1);
}

const prompt = createInterface({ input, output });
console.log("\nConfigurazione Euganeo Casa\n");
const appUrl = (await prompt.question("Indirizzo privato della webapp (es. https://euganeo.nome.ts.net): ")).trim();
const password = (await prompt.question("Password familiare (almeno 16 caratteri): ")).trim();
const googleClientId = (await prompt.question("Google OAuth Client ID: ")).trim();
const googleClientSecret = (await prompt.question("Google OAuth Client Secret: ")).trim();
prompt.close();

if (!appUrl.startsWith("https://") || password.length < 16 || !googleClientId || !googleClientSecret) {
  console.error("Configurazione non valida: usa HTTPS, una password di almeno 16 caratteri e le due credenziali Google.");
  process.exit(1);
}

const env = [
  `APP_URL=${appUrl}`,
  `APP_PASSWORD=${password}`,
  `SESSION_SECRET=${randomBytes(32).toString("base64url")}`,
  `CRON_SECRET=${randomBytes(32).toString("base64url")}`,
  `TOKEN_ENCRYPTION_KEY=${randomBytes(32).toString("hex")}`,
  `GOOGLE_CLIENT_ID=${googleClientId}`,
  `GOOGLE_CLIENT_SECRET=${googleClientSecret}`,
  "DATABASE_PATH=./data/euganeo.sqlite",
  "",
].join("\n");

await writeFile(".env", env, { encoding: "utf8", mode: 0o600 });
console.log("\nConfigurazione salvata in .env. Il file è escluso da Git.\n");
