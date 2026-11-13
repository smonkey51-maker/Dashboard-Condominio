// Payment items only carry the email date, so the actual due date ("scadenza
// 30/09/2026", "entro il 15 ottobre") is extracted from the subject/preview.

const MONTHS: Record<string, number> = {
  gennaio: 0, febbraio: 1, marzo: 2, aprile: 3, maggio: 4, giugno: 5,
  luglio: 6, agosto: 7, settembre: 8, ottobre: 9, novembre: 10, dicembre: 11,
  gen: 0, feb: 1, mar: 2, apr: 3, mag: 4, giu: 5, lug: 6, ago: 7, set: 8, sett: 8, ott: 9, nov: 10, dic: 11,
};

function build(day: number, month: number, year: number | undefined, sentAt: Date) {
  if (day < 1 || day > 31 || month < 0 || month > 11) return null;
  let y = year ?? sentAt.getFullYear();
  if (y < 100) y += 2000;
  let date = new Date(y, month, day, 23, 59, 59);
  // No year given: the due date is the first one on/after the email date.
  if (year === undefined && date.getTime() < sentAt.getTime() - 7 * 86400000) date = new Date(y + 1, month, day, 23, 59, 59);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function extractDueDate(text: string, sentAtIso: string): Date | null {
  const sentAt = new Date(sentAtIso);
  const t = text.toLowerCase();
  const found: Date[] = [];
  for (const m of t.matchAll(/\b(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?\b/g)) {
    const d = build(+m[1], +m[2] - 1, m[3] ? +m[3] : undefined, sentAt);
    if (d) found.push(d);
  }
  for (const m of t.matchAll(/\b(\d{1,2})(?:º|°)?\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre|gen|feb|mar|apr|mag|giu|lug|ago|sett?|ott|nov|dic)\.?(?:\s+(\d{4}))?/g)) {
    const d = build(+m[1], MONTHS[m[2]], m[3] ? +m[3] : undefined, sentAt);
    if (d) found.push(d);
  }
  if (!found.length) return null;
  // Several dates in one message: the latest is almost always the deadline.
  return found.sort((a, b) => b.getTime() - a.getTime())[0];
}

export function isRata(text: string) {
  return /\b(rata|rate|rateale|rateizzazione)\b/i.test(text);
}

// For long texts (email body, attachments): only dates introduced by a deadline keyword,
// and the nearest one that is not already old when several rates are listed.
export function extractKeywordDue(text: string, sentAtIso: string): Date | null {
  const sentAt = new Date(sentAtIso).getTime();
  const re = /(scadenz\w*|entro(?:\s+il)?|termine|versare\s+entro(?:\s+il)?)[^0-9\n]{0,30}(\d{1,2}[/.-]\d{1,2}(?:[/.-]\d{2,4})?|\d{1,2}(?:º|°)?\s+[a-zà-ù]+\.?(?:\s+\d{4})?)/gi;
  const dates: Date[] = [];
  for (const m of text.matchAll(re)) {
    const d = extractDueDate(m[2], sentAtIso);
    if (d) dates.push(d);
  }
  if (!dates.length) return null;
  dates.sort((a, b) => a.getTime() - b.getTime());
  return dates.find((d) => d.getTime() >= sentAt - 7 * 86400000) ?? dates[dates.length - 1];
}
