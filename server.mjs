import { createServer } from "node:http";
import next from "next";
import cron from "node-cron";

process.env.NODE_ENV ||= "production";
const port = Number(process.env.PORT || 3000);
const app = next({ dev: false, hostname: "127.0.0.1", port });
const handle = app.getRequestHandler();

await app.prepare();

createServer((request, response) => handle(request, response)).listen(port, "0.0.0.0", () => {
  console.log(`Euganeo Casa listening on port ${port}`);
});

async function scheduledSync() {
  if (!process.env.CRON_SECRET) return;
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/sync`, {
      method: "POST",
      headers: { "x-cron-secret": process.env.CRON_SECRET },
    });
    if (!response.ok) console.error("Scheduled sync failed", response.status, await response.text());
  } catch (error) {
    console.error("Scheduled sync failed", error);
  }
}

cron.schedule("0 */6 * * *", scheduledSync, { timezone: "Europe/Rome" });
setTimeout(scheduledSync, 20_000);
