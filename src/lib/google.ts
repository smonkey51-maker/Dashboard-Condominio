import { google } from "googleapis";
import { loadState, saveState, type SyncedItem } from "./db";
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
  const missing = [!clientId && "GOOGLE_CLIENT_ID", !clientSecret && "GOOGLE_CLIENT_SECRET", !appUrl && "APP_URL"].filter(Boolean);
  if (missing.length) throw new Error(`Google OAuth is not configured: missing ${missing.join(", ")}`);
  return new google.auth.OAuth2(clientId, clientSecret, `${appUrl}/api/google/callback`);
}

export function googleAuthorizationUrl(state: string) {
  return oauthClient().generateAuthUrl({ access_type: "offline", prompt: "consent", scope: scopes, state });
}

export async function saveGoogleAuthorization(code: string) {
  const client = oauthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) throw new Error("Google did not return a refresh token");
  const state = await loadState();
  state.googleRefreshToken = encryptSecret(tokens.refresh_token);
  await saveState(state);
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

type IncomingItem = Omit<SyncedItem, "external_id" | "occurred_at" | "ends_at" | "source_url" | "attachment_count"> & {
  externalId: string;
  occurredAt: string;
  endsAt: string | null;
  sourceUrl: string | null;
  attachmentCount: number;
};

function normalize(item: IncomingItem): SyncedItem {
  return {
    source: item.source,
    external_id: item.externalId,
    kind: item.kind,
    title: item.title,
    sender: item.sender,
    summary: item.summary,
    occurred_at: item.occurredAt,
    ends_at: item.endsAt,
    location: item.location,
    source_url: item.sourceUrl,
    unread: item.unread,
    attachment_count: item.attachmentCount,
  };
}

export async function syncGoogle() {
  const state = await loadState();
  if (!state.googleRefreshToken) throw new Error("Google account is not connected");

  const auth = oauthClient();
  auth.setCredentials({ refresh_token: decryptSecret(state.googleRefreshToken) });
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
    return normalize({
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
    });
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

  const events = (calendarResponse.data.items || []).filter((event) => event.id && event.summary).map((event) => normalize({
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

  const merged = new Map(state.items.map((item) => [`${item.source}:${item.external_id}`, item]));
  for (const item of [...emails.filter((item): item is SyncedItem => Boolean(item)), ...events]) {
    merged.set(`${item.source}:${item.external_id}`, item);
  }
  state.items = [...merged.values()]
    .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
    .slice(0, 300);
  state.lastRun = {
    synced_at: new Date().toISOString(),
    email_count: emails.filter(Boolean).length,
    event_count: events.length,
    status: "success",
  };
  await saveState(state);
  return { emails: emails.filter(Boolean).length, events: events.length };
}
