import { extractKeywordDue } from "./deadlines";

const KEY = /(importo|totale|rata|da versare|da pagare|acconto|saldo|quota|dovut[oa]|versamento|conguaglio|bonifico)/i;
const MONEY = /(?:€|eur(?:o)?\.?)\s*(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})|\d+(?:,\d{1,2}))|(\d{1,3}(?:\.\d{3})*,\d{2})\s*(?:€|euro\b)/gi;

// An amount is reported only when it is clearly the one asked for: introduced by a keyword
// (importo, rata, da versare...), or the only distinct amount in the text.
export function pickAmount(text: string): { amount: string | null; ambiguous: boolean } {
  const found: { value: string; index: number }[] = [];
  for (const m of text.matchAll(MONEY)) {
    const raw = m[1] ?? m[2];
    const [int, dec = "00"] = raw.split(",");
    found.push({ value: `€ ${int},${dec.padEnd(2, "0")}`, index: m.index ?? 0 });
  }
  if (!found.length) return { amount: null, ambiguous: false };
  const keyed = found.find((f) => KEY.test(text.slice(Math.max(0, f.index - 70), f.index)));
  if (keyed) return { amount: keyed.value, ambiguous: false };
  if (new Set(found.map((f) => f.value)).size === 1) return { amount: found[0].value, ambiguous: false };
  return { amount: null, ambiguous: true };
}

export type Extracted = {
  amount: string | null;
  due: string | null;            // ISO date
  source: "testo email" | "allegato" | null;
  ambiguous?: boolean;           // several different amounts and none clearly the right one
  checked_at: string;
};

export function extractFromTexts(sources: { label: "testo email" | "allegato"; text: string }[], sentAtIso: string): Extracted {
  let amount: string | null = null;
  let due: Date | null = null;
  let source: Extracted["source"] = null;
  let ambiguous = false;
  for (const s of sources) {
    const a = pickAmount(s.text);
    if (!amount && a.amount) { amount = a.amount; source = s.label; }
    if (!a.amount && a.ambiguous) ambiguous = true;
    if (!due) due = extractKeywordDue(s.text, sentAtIso);
  }
  return { amount, due: due ? due.toISOString() : null, source, ambiguous: !amount && ambiguous ? true : undefined, checked_at: new Date().toISOString() };
}
