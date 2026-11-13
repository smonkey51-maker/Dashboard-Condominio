import Link from "next/link";
import { IconChevron, IconCoin, IconUsers } from "../icons";
import SyncButton from "../SyncButton";
import { CommunicationRow } from "../Rows";
import { communicationsOf, documentsOf, itemRef, loadDashboard, longDate, meetingsOf, nextActionOf, syncLabel, timeOf, upcomingMeetings } from "@/lib/view";

export default async function Home() {
  const { items, lastRun, connected } = await loadDashboard();
  const action = nextActionOf(items);
  const documents = documentsOf(items);
  const comms = communicationsOf(items);
  const upcoming = upcomingMeetings(meetingsOf(items));

  return (
    <div className="home">
      <header className="home-head">
        <h1>Euganeo Casa</h1>
        <p className="home-sub">Condominio Euganeo</p>
        {connected && <SyncButton className="home-update" prefix="Ultimo aggiornamento: " label={lastRun ? syncLabel(lastRun.synced_at) : "mai"} problem={lastRun?.status === "error"} />}
      </header>

      {action ? (
        <Link href={`/dettaglio/${itemRef(action.kind === "payment" ? action.payment.item : action.meeting.item)}`} className="priority">
          <span className="row-icon attention">{action.kind === "payment" ? <IconCoin /> : <IconUsers />}</span>
          <span className="priority-main">
            <span className="priority-label">{action.kind === "payment" ? "Prossima scadenza" : "Prossima assemblea"}</span>
            {action.kind === "payment" ? (
              <>
                <span className="priority-title">{action.payment.title}</span>
                <span className="priority-meta">
                  Pagamento{action.payment.amount ? ` · Importo: ${action.payment.amount}` : ""}
                </span>
                <span className="priority-date">{action.payment.due ? `Scade il ${longDate(action.payment.due)}` : "Scadenza da verificare"}</span>
              </>
            ) : (
              <>
                <span className="priority-title">{action.meeting.title}</span>
                <span className="priority-meta">Assemblea{action.meeting.item.location ? ` · ${action.meeting.item.location}` : ""}</span>
                <span className="priority-date">{longDate(action.meeting.when)}{action.meeting.hasTime ? ` · ore ${timeOf(action.meeting.when)}` : ""}</span>
              </>
            )}
          </span>
          <span className={`chip ${action.kind === "payment" ? action.payment.status : "futura"}`}>
            {action.kind === "payment" ? (action.payment.status === "da-verificare" ? "Da verificare" : "In arrivo") : "In programma"}
          </span>
          <IconChevron className="chev" />
        </Link>
      ) : (
        <div className="priority calm">
          <span className="priority-main">
            <span className="priority-label">Prossima azione</span>
            <span className="priority-title">Nessuna azione in sospeso</span>
            <span className="priority-meta">Quando arriva una scadenza o una convocazione la trovi qui.</span>
          </span>
        </div>
      )}

      <nav className="tiles" aria-label="Riepilogo">
        <Link href="/documenti" className="tile"><strong>{documents.length}</strong><span>Documenti</span></Link>
        <Link href="/comunicazioni" className="tile"><strong>{comms.length}</strong><span>Comunicazioni</span></Link>
        <Link href="/assemblee" className="tile"><strong>{upcoming.length}</strong><span>Assemblee in programma</span></Link>
      </nav>

      <section className="block">
        <div className="block-head"><h2>Ultime comunicazioni</h2><Link href="/comunicazioni">Tutte →</Link></div>
        {comms.length ? <div className="rows">{comms.slice(0, 3).map((c) => <CommunicationRow key={`${c.item.source}-${c.item.external_id}`} c={c} />)}</div> : <p className="empty">Nessuna comunicazione ricevuta.</p>}
      </section>
    </div>
  );
}
