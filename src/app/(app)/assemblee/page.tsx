import { loadDashboard, meetingsOf, pastMeetings, upcomingMeetings } from "@/lib/view";
import { MeetingRow } from "../../Rows";

export default async function Assemblee() {
  const { items } = await loadDashboard();
  const all = meetingsOf(items);
  const next = upcomingMeetings(all);
  const history = pastMeetings(all);
  return (
    <>
      <h1>Assemblee</h1>
      <section className="block">
        <div className="block-head"><h2>In programma</h2></div>
        {next.length ? <div className="rows">{next.map((m) => <MeetingRow key={m.item.external_id} m={m} />)}</div> : <p className="empty">Nessuna assemblea in programma.</p>}
      </section>
      {history.length > 0 && (
        <section className="block">
          <div className="block-head"><h2>Storico</h2></div>
          <div className="rows">{history.map((m) => <MeetingRow key={m.item.external_id} m={m} />)}</div>
        </section>
      )}
    </>
  );
}
