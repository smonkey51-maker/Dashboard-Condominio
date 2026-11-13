import Link from "next/link";
import { IconChevron, IconUsers } from "../../icons";
import { DocumentRow, MeetingRow } from "../../Rows";
import { documentsOf, itemRef, loadDashboard, longDate, meetingsOf, pastMeetings, timeOf, upcomingMeetings } from "@/lib/view";

export default async function Assemblee() {
  const { items } = await loadDashboard();
  const all = meetingsOf(items);
  const next = upcomingMeetings(all);
  const history = pastMeetings(all);
  const verbali = documentsOf(items).filter((d) => /verbale/i.test(d.item.title));
  const first = next[0];

  return (
    <>
      <h1>Assemblee</h1>
      <p className="subtitle">{next.length ? `${next.length} in programma` : "Nessuna assemblea in programma"}{history.length ? ` · ${history.length} nello storico` : ""}</p>

      {first && (
        <Link href={`/dettaglio/${itemRef(first.item)}`} className="priority">
          <span className="row-icon"><IconUsers /></span>
          <span className="priority-main">
            <span className="priority-label">Prossima assemblea</span>
            <span className="priority-title">{longDate(first.when)}{first.hasTime ? ` · ore ${timeOf(first.when)}` : ""}</span>
            <span className="priority-meta">{first.title}{first.item.location ? ` · ${first.item.location}` : ""}</span>
          </span>
          <IconChevron className="chev" />
        </Link>
      )}

      {next.length > 1 && (
        <section className="block">
          <div className="block-head"><h2>In programma</h2></div>
          <div className="rows">{next.slice(1).map((m) => <MeetingRow key={m.item.external_id} m={m} />)}</div>
        </section>
      )}
      <section className="block">
        <div className="block-head"><h2>Storico</h2></div>
        {history.length ? <div className="rows">{history.map((m) => <MeetingRow key={m.item.external_id} m={m} />)}</div> : <p className="empty">Nessuna assemblea passata rilevata.</p>}
      </section>
      {verbali.length > 0 && (
        <section className="block">
          <div className="block-head"><h2>Verbali</h2></div>
          <div className="rows">{verbali.map((d) => <DocumentRow key={d.item.external_id} d={d} />)}</div>
        </section>
      )}
    </>
  );
}
