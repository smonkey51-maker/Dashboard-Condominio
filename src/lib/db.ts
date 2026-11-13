import { get, put } from "@vercel/blob";
import { decryptSecret, encryptSecret } from "./crypto";
import type { Extracted } from "./extract";

const STATE_PATH = "euganeo/state.enc";

export type Attachment = { part_id: string; filename: string; mime: string; size: number };

export type SyncedItem = {
  source: string;
  external_id: string;
  kind: string;
  title: string;
  sender: string | null;
  summary: string | null;
  occurred_at: string;
  ends_at: string | null;
  location: string | null;
  source_url: string | null;
  unread: number;
  attachment_count: number;
  file_types?: string[];
  attachments?: Attachment[];
  extracted?: Extracted;
};

export type SyncRun = {
  synced_at: string;
  email_count: number;
  event_count: number;
  status: "success" | "error";
  error?: string;
  needs_reconnect?: boolean;
};

export type AppState = {
  // One Google account (Gmail + Calendar). The two legacy fields are still read
  // so a connection made with the previous per-service flow keeps working.
  googleRefreshToken?: string;
  gmailRefreshToken?: string;
  calendarRefreshToken?: string;
  items: SyncedItem[];
  lastRun?: SyncRun;
};

const emptyState = (): AppState => ({ items: [] });

// The saved state is read often (every page) and written rarely (a sync), so the last copy is
// kept in memory and only revalidated with a conditional request (ETag): an unchanged state
// costs one tiny round trip instead of a download plus decryption.
let memo: { etag: string; state: AppState; checkedAt: number } | null = null;
const FRESH_MS = 10_000;

async function readState(force = false): Promise<AppState> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return emptyState();
  if (!force && memo && Date.now() - memo.checkedAt < FRESH_MS) return memo.state;
  const res = await get(STATE_PATH, { access: "private", useCache: false, ifNoneMatch: memo?.etag });
  if (!res) return emptyState();
  if (res.statusCode === 304 && memo) {
    memo.checkedAt = Date.now();
    return memo.state;
  }
  if (!res.stream) throw new Error("Empty response while reading the saved state");
  const state = JSON.parse(decryptSecret(await new Response(res.stream).text())) as AppState;
  memo = { etag: res.blob.etag, state, checkedAt: Date.now() };
  return state;
}

// For the sync: always revalidated, and a copy that can be modified. A read error must not
// look like "no data", otherwise the next save would overwrite the real state.
export async function loadState(): Promise<AppState> {
  return structuredClone(await readState(true));
}

export async function saveState(state: AppState) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("Vercel Blob is not configured");
  await put(STATE_PATH, encryptSecret(JSON.stringify(state)), {
    access: "private",
    allowOverwrite: true,
    contentType: "text/plain; charset=utf-8",
  });
  memo = null;
}

export async function dashboardData() {
  let state: AppState;
  try {
    state = await readState();
  } catch (error) {
    console.error("Failed to read saved state from Vercel Blob", error);
    state = emptyState();
  }
  return {
    items: [...state.items].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at)).slice(0, 100),
    lastRun: state.lastRun,
    connected: Boolean(state.googleRefreshToken || state.gmailRefreshToken || state.calendarRefreshToken),
  };
}
