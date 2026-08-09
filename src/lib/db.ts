import { get, put } from "@vercel/blob";
import { decryptSecret, encryptSecret } from "./crypto";

const STATE_PATH = "euganeo/state.enc";

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
};

export type SyncRun = {
  synced_at: string;
  email_count: number;
  event_count: number;
  status: "success" | "error";
};

type AppState = {
  googleRefreshToken?: string;
  items: SyncedItem[];
  lastRun?: SyncRun;
};

const emptyState = (): AppState => ({ items: [] });

export async function loadState(): Promise<AppState> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return emptyState();
  const result = await get(STATE_PATH, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) return emptyState();
  const encrypted = await new Response(result.stream).text();
  return JSON.parse(decryptSecret(encrypted)) as AppState;
}

export async function saveState(state: AppState) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("Vercel Blob is not configured");
  await put(STATE_PATH, encryptSecret(JSON.stringify(state)), {
    access: "private",
    allowOverwrite: true,
    contentType: "text/plain; charset=utf-8",
  });
}

export async function dashboardData() {
  const state = await loadState();
  return {
    items: [...state.items].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at)).slice(0, 100),
    lastRun: state.lastRun,
    connected: Boolean(state.googleRefreshToken),
  };
}
