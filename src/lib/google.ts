import { google } from "googleapis";
import { loadState, saveState, type SyncedItem } from "./db";
import { decryptSecret, encryptSecret } from "./crypto";
import { classify } from "./classify";

const googleScopes = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar.readonly",
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
  const loginHint = process.env.GOOGLE_LOGIN_EMAIL_NICOLO?.trim();
  return oauthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: googleScopes,
    include_granted_scopes: true,
    login_hint: loginHint || undefined,
    state,
  });
}

export async function saveGoogleAuthorization(code: string) {
  const client = oauthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) throw new Error("Google did not return a refresh token");
  const granted = (tokens.scope || "").split(" ");
  const missing = googleScopes.filter((scope) => !granted.includes(scope));
  if (missing.length) throw new Error(`Permessi Google mancanti: ${missing.join(", ")}`);
  const state = await loadState();
  state.googleRefreshToken = encryptSecret(tokens.refresh_token);
  delete state.gmailRefreshToken;
  delete state.calendarRefreshToken;
  state.lastRun = undefined;
  await saveState(state);
}

function clientFor(refreshToken: string | undefined) {
  if (!refreshToken) return null;
  const auth = oauthClient();
  auth.setCredentials({ refresh_token: decryptSecret(refreshToken) });
  return auth;
}

function isRevoked(error: unknown) {
  const text = error instanceof Error ? error.message : String(error);
  return /invalid_grant|invalid_rapt|unauthorized_client|Token has been expired or revoked/i.test(text);
}

function attachmentCount(part: { filename?: string | null; parts?: unknown[] | null } | undefined): number {
  if (!part) return 0;
  const children = (part.parts || []) as Array<{ filename?: string | null; parts?: unknown[] | null }>;
  return (part.filename ? 1 : 0) + children.reduce((sum, child) => sum + attachmentCount(child), 0);
}

function attachmentTypes(part: { filename?: string | null; parts?: unknown[] | null } | undefined, found = new Set<string>()): string[] {
  if (!part) return [...found];
  const ext = part.filename?.split(".").pop()?.toLowerCase();
  if (part.filename && ext && ext.length <= 5 && ext !== part.filename.toLowerCase()) found.add(ext);
  for (const child of (part.parts || []) as Array<{ filename?: string | null; parts?: unknown[] | null }>) attachmentTypes(child, found);
  return [...found];
}

type IncomingItem = Omit<SyncedItem, "external_id" | "occurred_at" | "ends_at" | "source_url" | "attachment_count" | "file_types"> & {
  externalId: string;
  occurredAt: string;
  endsAt: string | null;
  sourceUrl: string | null;
  attachmentCount: number;
  fileTypes?: string[];
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
    file_types: item.fileTypes,
  };
}

const CONDOMINIO_LABELS = ["condominio euganeo", "condominio_elaborato"];
const MAX_EMAILS = 300;

async function listEmailIds(gmail: ReturnType<typeof google.gmail>) {
  const { data } = await gmail.users.labels.list({ userId: "me" });
  const labelIds = (data.labels || [])
    .filter((label) => label.id && CONDOMINIO_LABELS.includes((label.name || "").trim().toLowerCase()))
    .map((label) => label.id!);

  const ids = new Set<string>();
  if (!labelIds.length) {
    // Labels not found (renamed?): fall back to a text search so the sync never goes empty.
    console.warn("Gmail labels for the condominio not found, using text search");
    const fallback = await gmail.users.messages.list({ userId: "me", maxResults: 100, q: 'in:anywhere ("Condominio Euganeo" OR Euganeo) -in:spam -in:trash' });
    (fallback.data.messages || []).forEach((m) => m.id && ids.add(m.id));
    return [...ids];
  }
  for (const labelId of labelIds) {
    let pageToken: string | undefined;
    do {
      const page = await gmail.users.messages.list({ userId: "me", labelIds: [labelId], maxResults: 100, pageToken });
      (page.data.messages || []).forEach((m) => m.id && ids.add(m.id));
      pageToken = ids.size < MAX_EMAILS ? page.data.nextPageToken || undefined : undefined;
    } while (pageToken);
  }
  return [...ids].slice(0, MAX_EMAILS);
}

async function fetchEmails(auth: ReturnType<typeof oauthClient>) {
  const gmail = google.gmail({ version: "v1", auth });
  const messageIds = await listEmailIds(gmail);

  const fetchOne = async (id: string) => {
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
      fileTypes: attachmentTypes(message.payload || undefined),
    });
  };

  // Chunked to stay under Gmail's per-user concurrency limits.
  const emails: SyncedItem[] = [];
  for (let i = 0; i < messageIds.length; i += 20) {
    emails.push(...(await Promise.all(messageIds.slice(i, i + 20).map(fetchOne))));
  }
  return emails;
}

async function fetchEvents(auth: ReturnType<typeof oauthClient>) {
  const calendar = google.calendar({ version: "v3", auth });
  const now = new Date();
  const calendarResponse = await calendar.events.list({
    calendarId: "primary",
    q: "Euganeo",
    singleEvents: true,
    orderBy: "startTime",
    timeMin: new Date(now.getTime() - 730 * 86400000).toISOString(),
    timeMax: new Date(now.getTime() + 540 * 86400000).toISOString(),
    maxResults: 250,
  });

  return (calendarResponse.data.items || []).filter((event) => event.id && event.summary).map((event) => normalize({
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
}

export async function syncGoogle() {
  const state = await loadState();
  const legacy = state.gmailRefreshToken || state.calendarRefreshToken;
  const token = state.googleRefreshToken || legacy;
  const auth = clientFor(token);
  if (!auth) throw new Error("Nessun account Google collegato");
  // A legacy single-service token only covers one service: don't query the other.
  const useGmail = Boolean(state.googleRefreshToken || state.gmailRefreshToken);
  const useCalendar = Boolean(state.googleRefreshToken || (!state.gmailRefreshToken && state.calendarRefreshToken));

  const [gmailResult, calendarResult] = await Promise.allSettled([
    useGmail ? fetchEmails(auth) : Promise.resolve([] as SyncedItem[]),
    useCalendar ? fetchEvents(auth) : Promise.resolve([] as SyncedItem[]),
  ]);
  const failures = [gmailResult, calendarResult].filter((r): r is PromiseRejectedResult => r.status === "rejected");
  const emails = gmailResult.status === "fulfilled" ? gmailResult.value : [];
  const events = calendarResult.status === "fulfilled" ? calendarResult.value : [];

  if (failures.length) {
    failures.forEach((f) => console.error("Google sync partial failure", f.reason));
    // Keep whatever succeeded, and record the failure so the UI can show it.
    const reconnect = failures.some((f) => isRevoked(f.reason));
    state.lastRun = {
      synced_at: new Date().toISOString(),
      email_count: emails.length,
      event_count: events.length,
      status: "error",
      error: reconnect ? "Autorizzazione Google scaduta o revocata" : "Errore durante la lettura di Gmail o Calendar",
      needs_reconnect: reconnect,
    };
  }

  const merged = new Map(state.items.map((item) => [`${item.source}:${item.external_id}`, item]));
  for (const item of [...emails, ...events]) merged.set(`${item.source}:${item.external_id}`, item);
  state.items = [...merged.values()]
    .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
    .slice(0, 300);
  if (!failures.length) {
    state.lastRun = { synced_at: new Date().toISOString(), email_count: emails.length, event_count: events.length, status: "success" };
  }
  await saveState(state);
  if (failures.length === 2 || (failures.length && !emails.length && !events.length)) {
    throw new Error(state.lastRun!.error);
  }
  return { emails: emails.length, events: events.length, partial: failures.length > 0 };
}
