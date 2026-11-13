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

export function syncLabel(iso: string) {
  const d = new Date(iso);
  const day = (x: Date) => fmt({ year: "numeric", month: "numeric", day: "numeric" }).format(x);
  const now = new Date();
  if (day(d) === day(now)) return `oggi, ${timeOf(d)}`;
  if (day(d) === day(new Date(now.getTime() - 86400000))) return `ieri, ${timeOf(d)}`;
  return `${fmt({ day: "numeric", month: "short" }).format(d)}, ${timeOf(d)}`;
}

// ---------- titles ----------

const ACRONYMS = new Set(["FV", "IVA", "IBAN", "PDF", "TARI", "IMU", "ENEL", "SPA", "SRL", "CDA", "ES"]);

export function cleanTitle(raw: string) {
  return raw
    .replace(/\p{Extended_Pictographic}|️|‍/gu, "")
    .replace(/^\s*((re|r|fwd?|i|inoltra|rif)\s*:\s*)+/i, "")
    .replace(/\s+/g, " ")
    .replace(/^[\s\-–—:|·]+|[\s\-–—:|·]+$/g, "")
    .trim();
}

// Readable title for lists. The original subject is always kept in the detail page.
export function normalizeTitle(raw: string) {
  const t = cleanTitle(raw);
  if (!t) return "(senza oggetto)";
  const acconto = t.match(/acconto.*?(20\d{2})\s*[-–/]\s*(20\d{2})/i);
  if (acconto) return `Acconto condominiale ${acconto[1]}–${acconto[2]}`;
  const rata = t.match(/\brata\s*(?:n\.?°?\s*)?(\d{1,2})\b/i);
  if (rata) return `Rata ${rata[1]}`;
  const verbale = t.match(/verbale.*?(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4})/i);
  if (verbale) return `Verbale assemblea ${verbale[1].replace(/[.-]/g, "/")}`;

  let out = t.replace(/^condomini(?:o|uo)\s+euganeo\s*[-–:|]?\s*/i, "").replace(/\.+$/, "").trim();
  if (!out) out = t;
  const letters = out.replace(/[^A-Za-zÀ-ÿ]/g, "");
  const upper = letters.replace(/[^A-ZÀ-Þ]/g, "");
  if (letters.length > 6 && upper.length / letters.length > 0.6) {
    out = out
      .split(/(\s+)/)
      .map((w) => (/^\s+$/.test(w) || ACRONYMS.has(w) || /^[A-ZÀ-Þ]$/.test(w) || /\d/.test(w) ? w : w.toLowerCase()))
      .join("");
  }
  return out.charAt(0).toUpperCase() + out.slice(1);
}

export function extractAmount(text: string): string | null {
  const m = text.match(/(?:€|eur(?:o)?\.?)\s*(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})|\d+(?:,\d{1,2})?)|(\d{1,3}(?:\.\d{3})*,\d{2})\s*(?:€|euro\b)/i);
  const raw = m?.[1] ?? m?.[2];
  if (!raw) return null;
  const [int, dec = "00"] = raw.split(",");
  return `€ ${int},${dec.padEnd(2, "0")}`;
}

// ---------- categories ----------

export type Category = "payment" | "assembly" | "document" | "maintenance" | "update";

export const kindOf = (item: SyncedItem): Category =>
  (item.source === "gmail" ? classify(item.title, item.attachment_count) : item.kind) as Category;

export const categoryLabels: Record<string, string> = {
  assembly: "Assemblea",
  payment: "Pagamento",
  document: "Documento",
  maintenance: "Manutenzione",
  event: "Evento",
  update: "Comunicazione",
};

// filter groups used by the Comunicazioni page
export const filterGroups = [
  { id: "pagamenti", label: "Pagamenti", match: (k: Category) => k === "payment" },
  { id: "assemblee", label: "Assemblee", match: (k: Category) => k === "assembly" },
  { id: "manutenzione", label: "Manutenzione", match: (k: Category) => k === "maintenance" },
  { id: "generale", label: "Generale", match: (k: Category) => k === "update" || k === "document" },
] as const;

export function fileTypeOf(item: SyncedItem) {
  const ext = item.file_types?.[0];
  if (!ext) return item.attachment_count > 0 ? "Allegato" : "Nessun allegato";
  if (ext === "pdf") return "PDF";
  if (["xls", "xlsx", "csv", "ods"].includes(ext)) return "Foglio di calcolo";
  if (["doc", "docx", "odt", "rtf"].includes(ext)) return "Documento Word";
  if (["jpg", "jpeg", "png", "heic", "gif"].includes(ext)) return "Immagine";
  return ext.toUpperCase();
}

export const itemRef = (item: SyncedItem) => encodeURIComponent(`${item.source}~${item.external_id}`);
export const findItem = (items: SyncedItem[], ref: string) => {
  let decoded = ref;
  try { decoded = decodeURIComponent(ref); } catch { /* keep as is */ }
  return items.find((i) => `${i.source}~${i.external_id}` === decoded);
};

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
export const matchesQuery = (item: SyncedItem, title: string, q: string) => {
  const needle = norm(q.trim());
  return !needle || norm(`${title} ${item.title} ${item.summary || ""}`).includes(needle);
};

// ---------- payments ----------

export type PaymentStatus = "da-verificare" | "futura" | "superata" | "confermata";
export const paymentStatusLabels: Record<PaymentStatus, string> = {
  "da-verificare": "Da verificare",
  futura: "Scadenza futura",
  superata: "Scadenza superata",
  confermata: "Pagamento confermato",
};

const CONFIRMED = /\b(quietanza|ricevuta di pagamento|pagamento (?:ricevuto|effettuato|confermato)|bonifico eseguito|saldato)\b/i;
const DAY = 86400000;

export type Payment = {
  item: SyncedItem;
  title: string;
  amount: string | null;
  due: Date | null;
  rata: boolean;
  status: PaymentStatus;
  section: "arrivo" | "superata" | "storico";
};

// A passed due date is never "unpaid" on its own: the app has no proof of payment,
// so it only says the deadline has passed.
export function paymentsOf(items: SyncedItem[]): Payment[] {
  const now = Date.now();
  const list: Payment[] = items.filter((i) => kindOf(i) === "payment").map((item) => {
    const text = `${item.title} ${item.summary || ""}`;
    const due = extractDueDate(text, item.occurred_at);
    const status: PaymentStatus = CONFIRMED.test(text) ? "confermata" : !due ? "da-verificare" : due.getTime() >= now ? "futura" : "superata";
    const ageDays = (now - (due ?? new Date(item.occurred_at)).getTime()) / DAY;
    let section: Payment["section"] = "storico";
    if (status === "futura") section = "arrivo";
    else if (status === "da-verificare" && ageDays <= 60) section = "arrivo";
    else if (status === "superata" && ageDays <= 180) section = "superata";
    return { item, title: normalizeTitle(item.title), amount: extractAmount(text), due, rata: isRata(text), status, section };
  });
  const rank = { arrivo: 0, superata: 1, storico: 2 } as const;
  const key = (p: Payment) => (p.due ?? new Date(p.item.occurred_at)).getTime();
  return list.sort((a, b) => rank[a.section] - rank[b.section] || (a.section === "arrivo" ? key(a) - key(b) : key(b) - key(a)));
}

// ---------- meetings ----------

export type Meeting = { item: SyncedItem; title: string; when: Date; whenKnown: boolean; hasTime: boolean; past: boolean };

export function meetingsOf(items: SyncedItem[]): Meeting[] {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return items.filter((i) => kindOf(i) === "assembly").map((item) => {
    const text = `${item.title} ${item.summary || ""}`;
    let when = new Date(item.occurred_at);
    let whenKnown = item.source === "calendar";
    let hasTime = item.source === "calendar" && item.occurred_at.includes("T");
    if (item.source !== "calendar") {
      const due = extractDueDate(text, item.occurred_at);
      if (due) {
        when = due; whenKnown = true;
        const t = text.match(/\bore\s+(\d{1,2})[:.](\d{2})/i);
        if (t) { when = new Date(due); when.setHours(+t[1], +t[2], 0, 0); hasTime = true; }
      }
    }
    return { item, title: normalizeTitle(item.title), when, whenKnown, hasTime, past: !whenKnown || when.getTime() < startOfToday.getTime() };
  }).sort((a, b) => a.when.getTime() - b.when.getTime());
}
export const upcomingMeetings = (m: Meeting[]) => m.filter((x) => !x.past);
export const pastMeetings = (m: Meeting[]) => m.filter((x) => x.past).reverse();

// ---------- documents and communications ----------

export type DocEntry = { item: SyncedItem; title: string; type: string; year: number };
export function documentsOf(items: SyncedItem[]): DocEntry[] {
  return items
    .filter((i) => kindOf(i) === "document" || i.attachment_count > 0)
    .map((item) => ({ item, title: normalizeTitle(item.title), type: fileTypeOf(item), year: new Date(item.occurred_at).getFullYear() }))
    .sort((a, b) => b.item.occurred_at.localeCompare(a.item.occurred_at));
}

export type Communication = { item: SyncedItem; title: string; kind: Category; type: string };
export function communicationsOf(items: SyncedItem[]): Communication[] {
  const seen = new Set<string>();
  return items
    .filter((i) => i.source === "gmail")
    .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
    .map((item) => ({ item, title: normalizeTitle(item.title), kind: kindOf(item), type: categoryLabels[kindOf(item)] || "Comunicazione" }))
    // Same subject on the same day (replies, forwards): one row; the originals stay in Gmail.
    .filter((c) => {
      const key = `${c.title.toLowerCase()}|${c.item.occurred_at.slice(0, 10)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

// ---------- next action (Panoramica) ----------

// Share of the time between the email and the due date that has already passed (0-100).
// Only for payments with a known due date; never an estimate of anything else.
export function elapsedPct(p: Payment): number | null {
  if (!p.due) return null;
  const from = new Date(p.item.occurred_at).getTime();
  const to = p.due.getTime();
  if (to <= from) return null;
  return Math.round(Math.min(1, Math.max(0, (Date.now() - from) / (to - from))) * 100);
}


export type NextAction =
  | { kind: "payment"; payment: Payment }
  | { kind: "meeting"; meeting: Meeting }
  | null;

export function nextActionOf(items: SyncedItem[]): NextAction {
  const dated = paymentsOf(items).filter((p) => p.status === "futura");
  const meeting = upcomingMeetings(meetingsOf(items))[0];
  const payment = dated[0];
  if (payment && meeting) return payment.due!.getTime() <= meeting.when.getTime() ? { kind: "payment", payment } : { kind: "meeting", meeting };
  if (payment) return { kind: "payment", payment };
  if (meeting) return { kind: "meeting", meeting };
  const unknown = paymentsOf(items).find((p) => p.status === "da-verificare" && p.section === "arrivo");
  return unknown ? { kind: "payment", payment: unknown } : null;
}

export function mapsUrl(location: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

export function formatIban(iban: string) {
  return iban.replace(/\s+/g, "").match(/.{1,4}/g)?.join(" ") ?? iban;
}
export function maskIban(iban: string) {
  const parts = formatIban(iban).split(" ");
  return parts.map((p, i) => (i === 0 || i === parts.length - 1 ? p : "••••")).join(" ");
}
export const CONDOMINIO_IBAN = "IT10S0306912139100000010025";
