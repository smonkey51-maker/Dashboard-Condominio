import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryIcon } from "../../../Rows";
import { IconBack } from "../../../icons";
import { categoryLabels, fileTypeOf, findItem, kindOf, loadDashboard, longDate, mapsUrl, meetingsOf, normalizeTitle, paymentsOf, paymentStatusLabels, shortDate, syncLabel, timeOf } from "@/lib/view";

export default async function Dettaglio({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const { items, lastRun } = await loadDashboard();
  const item = findItem(items, ref);
  if (!item) notFound();

  const kind = kindOf(item);
  const title = normalizeTitle(item.title);
  const payment = kind === "payment" ? paymentsOf(items).find((p) => p.item === item) : undefined;
  const meeting = kind === "assembly" ? meetingsOf(items).find((m) => m.item === item) : undefined;
  const sameDay = (a: string, b: string) => a.slice(0, 10) === b.slice(0, 10);
  const duplicates = items.filter((i) => i !== item && i.source === "gmail" && normalizeTitle(i.title) === title && sameDay(i.occurred_at, item.occurred_at)).length;
  const back = kind === "payment" ? ["/pagamenti", "Pagamenti"] : kind === "assembly" ? ["/assemblee", "Assemblee"] : kind === "document" ? ["/documenti", "Documenti"] : ["/comunicazioni", "Comunicazioni"];

  const rows: [string, React.ReactNode][] = [
    ["Categoria", categoryLabels[kind] ?? "Comunicazione"],
    ["Provenienza", item.source === "gmail" ? "Email (Gmail)" : "Calendario Google"],
    [item.source === "gmail" ? "Email ricevuta il" : "Data", `${longDate(item.occurred_at)}${item.source === "calendar" && item.occurred_at.includes("T") ? ` · ore ${timeOf(item.occurred_at)}` : ""}`],
  ];
  if (payment) {
    rows.push(["Stato", paymentStatusLabels[payment.status]]);
    rows.push(["Scadenza", payment.due ? longDate(payment.due) : "Da verificare: nessuna data nel testo"]);
    if (payment.amount) rows.push(["Importo", `${payment.amount} (letto dal testo dell’email, da confermare)`]);
  }
  if (meeting) {
    rows.push(["Data assemblea", meeting.whenKnown ? `${longDate(meeting.when)}${meeting.hasTime ? ` · ore ${timeOf(meeting.when)}` : ""}` : "Da verificare: nessuna data nel testo"]);
  }
  if (item.location) rows.push(["Luogo", <a key="l" href={mapsUrl(item.location)} target="_blank" rel="noreferrer">{item.location}</a>]);
  if (item.sender) rows.push(["Mittente", item.sender]);
  if (item.attachment_count > 0) rows.push(["Allegati", `${item.attachment_count} · ${fileTypeOf(item)}`]);
  if (duplicates > 0) rows.push(["Email collegate", `${duplicates} con lo stesso oggetto nello stesso giorno`]);
  if (lastRun) rows.push(["Ultimo aggiornamento", syncLabel(lastRun.synced_at)]);

  return (
    <article className="detail">
      <Link href={back[0]} className="back"><IconBack />{back[1]}</Link>
      <div className="detail-head">
        <CategoryIcon kind={kind} />
        <h1>{title}</h1>
      </div>
      <dl className="facts">
        {rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
      </dl>
      <section className="original">
        <p className="eyebrow">Oggetto originale</p>
        <p className="original-title">{item.title || "(senza oggetto)"}</p>
        {item.summary && <><p className="eyebrow">Anteprima</p><p className="original-text">{item.summary}</p></>}
      </section>
      {item.source_url && <a className="button" href={item.source_url} target="_blank" rel="noreferrer">Apri l’originale ↗</a>}
      <p className="note">Inviata il {shortDate(item.occurred_at)}. La dashboard conserva solo oggetto, mittente, data e una breve anteprima.</p>
    </article>
  );
}
