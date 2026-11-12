import { cache } from "react";
import { dashboardData, type SyncedItem } from "./db";
import { extractDueDate, isRata } from "./deadlines";

export const loadDashboard = cache(dashboardData);

const TZ = "Europe/Rome";
const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("it-IT", { timeZone: TZ, ...opts });

export const longDate = (d: Date | string) => fmt({ day: "numeric", month: "long", year: "numeric" }).format(new Date(d));
export const shortDate = (d: Date | string) => fmt({ day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
export const timeOf = (d: Date | string) => fmt({ hour: "2-digit", minute: "2-digit" }).format(new Date(d));

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

export type Payment = { item: SyncedItem; title: string; amount: string | null; due: Date | null; past: boolean; rata: boolean };

export function paymentsOf(items: SyncedItem[]): Payment[] {
  const all = items.filter((i) => i.kind === "payment").map((item) => {
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
  const all = items.filter((i) => i.kind === "assembly").map((item) => {
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
    .filter((i) => i.kind === "document" || i.attachment_count > 0)
    .map((item) => ({ item, title: cleanTitle(item.title), type: fileTypeOf(item), badge: (item.file_types?.[0] || "file").toUpperCase() }))
    .sort((a, b) => b.item.occurred_at.localeCompare(a.item.occurred_at));
}

export type Communication = { item: SyncedItem; title: string; type: string };

export function communicationsOf(items: SyncedItem[]): Communication[] {
  return items
    .filter((i) => i.source === "gmail")
    .map((item) => ({ item, title: cleanTitle(item.title), type: kindLabels[item.kind] || "Comunicazione" }))
    .sort((a, b) => b.item.occurred_at.localeCompare(a.item.occurred_at));
}

export function mapsUrl(location: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

export function formatIban(iban: string) {
  return iban.replace(/\s+/g, "").match(/.{1,4}/g)?.join(" ") ?? iban;
}
export const CONDOMINIO_IBAN = "IT10S0306912139100000010025";
