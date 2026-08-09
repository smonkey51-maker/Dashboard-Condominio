import { google } from "googleapis";
import { db, getSetting, setSetting } from "./db";
import { decryptSecret, encryptSecret } from "./crypto";

const scopes = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar.readonly",
  "openid",
  "email",
];

function oauthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.APP_URL;
  if (!clientId || !clientSecret || !appUrl) throw new Error("Google OAuth is not configured");
  return new google.auth.OAuth2(clientId, clientSecret, `${appUrl}/api/google/callback`);
}

export function googleAuthorizationUrl(state: string) {
  return oauthClient().generateAuthUrl({ access_type: "offline", prompt: "consent", scope: scopes, state });
}

export async function saveGoogleAuthorization(code: string) {
  const client = oauthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) throw new Error("Google did not return a refresh token");
  setSetting("google_refresh_token", encryptSecret(tokens.refresh_token));
}

function attachmentCount(part: { filename?: string | null; parts?: unknown[] | null } | undefined): number {
  if (!part) return 0;
  const children = (part.parts || []) as Array<{ filename?: string | null; parts?: unknown[] | null }>;
  return (part.filename ? 1 : 0) + children.reduce((sum, child) => sum + attachmentCount(child), 0);
}

function classify(subject: string, attachments: number) {
  const text = subject.toLowerCase();
  if (/assemblea|convocazione|verbale/.test(text)) return "assembly";
  if (/rata|pagamento|scadenza|saldo|bonifico/.test(text)) return "payment";
  if (attachments > 0) return "document";
  return "update";
}

export async function syncGoogle() {
  const stored = getSetting("google_refresh_token");
  if (!stored) throw new Error("Google account is not connected");

  const auth = oauthClient();
  auth.setCredentials({ refresh_token: decryptSecret(stored) });
  const gmail = google.gmail({ version: "v1", auth });
  const calendar = google.calendar({ version: "v3", auth });
  const now = new Date();
  const emailList = await gmail.users.messages.list({
    userId: "me",
    maxResults: 100,
    q: 'in:anywhere ("Condominio Euganeo" OR Euganeo) -in:spam -in:trash',
  });

  const emails = await Promise.all((emailList.data.messages || []).map(async ({ id }) => {
    if (!id) return null;
    const response = await gmail.users.messages.get({ userId: "me", id, format: "full" });
    const message = response.data;
    const headers = Object.fromEntries((message.payload?.headers || []).map((header) => [header.name?.toLowerCase(), header.value || ""]));
    const attachments = attachmentCount(message.payload || undefined);
    return {
      source: "gmail",
      externalId: id,
      kind: classify(headers.subject || "", attachments),
      title: headers.subject || "(senza oggetto)",
      sender: headers.from || "",
      summary: message.snippet || "",
      occurredAt: new Date(Number(message.internalDate || Date.now())).toISOString(),
      endsAt: null,
      location: null,
      sourceUrl: `https://mail.google.com/mail/#all/${id}`,
      unread: message.labelIds?.includes("UNREAD") ? 1 : 0,
      attachmentCount: attachments,
    };
  }));

  const calendarResponse = await calendar.events.list({
    calendarId: "primary",
    q: "Euganeo",
    singleEvents: true,
    orderBy: "startTime",
    timeMin: new Date(now.getTime() - 730 * 86400000).toISOString(),
    timeMax: new Date(now.getTime() + 540 * 86400000).toISOString(),
    maxResults: 250,
  });

  const events = (calendarResponse.data.items || []).filter((event) => event.id && event.summary).map((event) => ({
    source: "calendar",
    externalId: event.id!,
    kind: /assemblea|riunione|convocazione/i.test(event.summary || "") ? "assembly" : "event",
    title: event.summary!,
    sender: null,
    summary: event.description || "",
    occurredAt: event.start?.dateTime || event.start?.date || now.toISOString(),
    endsAt: event.end?.dateTime || event.end?.date || null,
    location: event.location || null,
    sourceUrl: event.htmlLink || null,
    unread: 0,
    attachmentCount: 0,
  }));

  const upsert = db.prepare(`INSERT INTO synced_items
    (source, external_id, kind, title, sender, summary, occurred_at, ends_at, location, source_url, unread, attachment_count, updated_at)
    VALUES (@source, @externalId, @kind, @title, @sender, @summary, @occurredAt, @endsAt, @location, @sourceUrl, @unread, @attachmentCount, @updatedAt)
    ON CONFLICT(source, external_id) DO UPDATE SET
      kind=excluded.kind, title=excluded.title, sender=excluded.sender, summary=excluded.summary,
      occurred_at=excluded.occurred_at, ends_at=excluded.ends_at, location=excluded.location,
      source_url=excluded.source_url, unread=excluded.unread, attachment_count=excluded.attachment_count,
      updated_at=excluded.updated_at`);

  db.exec("BEGIN IMMEDIATE");
  try {
    const updatedAt = new Date().toISOString();
    for (const item of [...emails.filter(Boolean), ...events]) upsert.run({ ...item, updatedAt });
    db.prepare("INSERT INTO sync_runs(synced_at, email_count, event_count, status) VALUES (?, ?, ?, 'success')")
      .run(updatedAt, emails.filter(Boolean).length, events.length);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  return { emails: emails.filter(Boolean).length, events: events.length };
}
