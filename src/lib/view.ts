import { cache } from "react";
import { dashboardData, type SyncedItem } from "./db";
import { extractDueDate, isRata } from "./deadlines";
import { classify } from "./classify";

export const loadDashboard = cache(dashboardData);

const TZ = "Europe/Rome";
const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("it-IT", { timeZone: TZ, ...opts });

export const longDate = (d: Date | string) => fmt({ day: "numeric", month: "long", year: "numeric" }).format(new Date(d));
export const shortDate = (d: Date | string) => fmt({ day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
export const timeOf = (d: Date | string) => fmt({ hour: "2-digit", minute: "2-digit" }).format(new Date(d));

export const todayLabel = () => fmt({ weekday: "long", day: "numeric", month: "long" }).format(new Date());

export function syncLabel(iso: string) {
  const d = new Date(iso);
  const day = (x: Date) => fmt({ year: "numeric", month: "numeric", day: "numeric" }).format(x);
  const now = new Date();
  if (day(d) === day(now)) return `oggi, ${timeOf(d)}`;
  if (day(d) === day(new Date(now.getTime() - 86400000))) return `ieri, ${timeOf(d)}`;
  return `${fmt({ day: "numeric", month: "short" }).format(d)}, ${timeOf(d)}`;
}

// ---------- text cleanup ----------

export function cleanTitle(raw: string) {
  return raw
    .replace(/\p{Extended_Pictographic}|️|‍/gu, "")
    .replace(/^\s*((re|r|fwd?|i|inoltra|rif)\s*:\s*)+/i, "")
    .replace(/\s+/g, " ")
    .replace(/^[\s\-–—:|·]+|[\s\-–—:|·]+$/g, "")
    .trim() || "(senza oggetto)";
}

export function extractAmount(text: string): string | null {
  const m = text.match(/(?:€|eur(?:o)?\.?)\s*(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})|\d+(?:,\d{1,2})?)|(\d{1,3}(?:\.\d{3})*,\d{2})\s*(?:€|euro\b)/i);
  const raw = m?.[1] ?? m?.[2];
  if (!raw) return null;
  const [int, dec = "00"] = raw.split(",");
  return `€ ${int},${dec.padEnd(2, "0")}`;
}

function fileTypeOf(item: SyncedItem) {
  const ext = item.file_types?.[0];
  if (!ext) return item.attachment_count > 1 ? `${item.attachment_count} allegati` : "Allegato";
  if (ext === "pdf") return "PDF";
  if (["xls", "xlsx", "csv", "ods"].includes(ext)) return "Foglio di calcolo";
  if (["doc", "docx", "odt", "rtf"].includes(ext)) return "Documento Word";
  if (["jpg", "jpeg", "png", "heic", "gif"].includes(ext)) return "Immagine";
  return ext.toUpperCase();
}

const kindLabels: Record<string, string> = {
  assembly: "Assemblea",
  payment: "Pagamento",
  document: "Documento",
  event: "Evento",
  update: "Comunicazione",
};

// ---------- view models ----------

const kindOf = (item: SyncedItem) => (item.source === "gmail" ? classify(item.title, item.attachment_count) : item.kind);


export type Payment = { item: SyncedItem; title: string; amount: string | null; due: Date | null; past: boolean; rata: boolean };

export function paymentsOf(items: SyncedItem[]): Payment[] {
  const all = items.filter((i) => kindOf(i) === "payment").map((item) => {
    const text = `${item.title} ${item.summary || ""}`;
    const due = extractDueDate(text, item.occurred_at);
    const rata = isRata(text);
    const n = text.match(/\brata\s*(?:n\.?°?\s*)?(\d{1,2})\b/i)?.[1];
    const past = due ? due.getTime() < Date.now() : Date.now() - new Date(item.occurred_at).getTime() > 30 * 86400000;
    return { item, title: rata && n ? `Rata ${n} · Condominio Euganeo` : cleanTitle(item.title), amount: extractAmount(text), due, past, rata };
  });
  const key = (p: Payment) => (p.due ?? new Date(p.item.occurred_at)).getTime();
  return [...all.filter((p) => !p.past).sort((a, b) => key(a) - key(b)), ...all.filter((p) => p.past).sort((a, b) => key(b) - key(a))];
}

export type Meeting = { item: SyncedItem; title: string; when: Date; hasTime: boolean; past: boolean };

export function meetingsOf(items: SyncedItem[]): Meeting[] {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const all = items.filter((i) => kindOf(i) === "assembly").map((item) => {
    const text = `${item.title} ${item.summary || ""}`;
    let when = new Date(item.occurred_at);
    let hasTime = item.source === "calendar" && item.occurred_at.includes("T");
    if (item.source !== "calendar") {
      const due = extractDueDate(text, item.occurred_at);
      if (due) {
        when = due;
        const t = text.match(/\bore\s+(\d{1,2})[:.](\d{2})/i);
        if (t) { when = new Date(due); when.setHours(+t[1], +t[2], 0, 0); hasTime = true; }
      }
    }
    return { item, title: cleanTitle(item.title), when, hasTime, past: when.getTime() < startOfToday.getTime() };
  });
  return all.sort((a, b) => a.when.getTime() - b.when.getTime());
}

export const upcomingMeetings = (m: Meeting[]) => m.filter((x) => !x.past);
export const pastMeetings = (m: Meeting[]) => m.filter((x) => x.past).reverse();

export type DocEntry = { item: SyncedItem; title: string; type: string; badge: string };

export function documentsOf(items: SyncedItem[]): DocEntry[] {
  return items
    .filter((i) => kindOf(i) === "document" || i.attachment_count > 0)
    .map((item) => ({ item, title: cleanTitle(item.title), type: fileTypeOf(item), badge: (item.file_types?.[0] || "file").toUpperCase() }))
    .sort((a, b) => b.item.occurred_at.localeCompare(a.item.occurred_at));
}

export type Communication = { item: SyncedItem; title: string; type: string };

export function communicationsOf(items: SyncedItem[]): Communication[] {
  const seen = new Set<string>();
  return items
    .filter((i) => i.source === "gmail")
    .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
    .map((item) => ({ item, title: cleanTitle(item.title), type: kindLabels[kindOf(item)] || "Comunicazione" }))
    // Same subject on the same day (thread replies, forwards): keep one.
    .filter((c) => {
      const key = `${c.title.toLowerCase()}|${c.item.occurred_at.slice(0, 10)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

const IMPORTANT = /\b(urgent\w*|verbale|convocazione|assemblea|bilancio|preventivo|consuntivo|regolamento|delibera\w*|rata|rate|acconto|versamento|scadenza|sollecito|avviso|lavori|guasto|interruzione)\b/i;

// What deserves a place on the home page: money, meetings, anything flagged
// as important by its wording, or still unread — and recent.
export function importantOf(items: SyncedItem[], days = 120): Communication[] {
  const limit = Date.now() - days * 86400000;
  return communicationsOf(items).filter((c) => {
    if (new Date(c.item.occurred_at).getTime() < limit) return false;
    const kind = kindOf(c.item);
    return kind === "payment" || kind === "assembly" || IMPORTANT.test(c.item.title) || Boolean(c.item.unread);
  });
}

export function mapsUrl(location: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

export function formatIban(iban: string) {
  return iban.replace(/\s+/g, "").match(/.{1,4}/g)?.join(" ") ?? iban;
}
export const CONDOMINIO_IBAN = "IT10S0306912139100000010025";
