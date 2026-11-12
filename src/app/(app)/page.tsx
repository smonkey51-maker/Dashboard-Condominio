import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { documentsOf, importantOf, loadDashboard, longDate, mapsUrl, meetingsOf, paymentsOf, pastMeetings, shortDate, timeOf, upcomingMeetings } from "@/lib/view";
import { CommunicationRow, DocumentRow } from "../Rows";
import { IconPin } from "../icons";

export default async function Home() {
  const user = await getSessionUser();
  const { items } = await loadDashboard();
  const upcomingPayments = paymentsOf(items).filter((p) => !p.past);
  // Prefer a deadline with a known amount: it is the actionable one.
  const nextPayment = upcomingPayments.find((p) => p.amount) ?? upcomingPayments[0];
  const meetings = meetingsOf(items);
  const nextMeeting = upcomingMeetings(meetings)[0];
  const lastMeeting = pastMeetings(meetings)[0];
  const important = importantOf(items).slice(0, 3);
  const documents = documentsOf(items).slice(0, 2);

  return (
    <div className="home">
      <h1 className="greeting">Ciao{user ? `, ${user.name}` : ""}</h1>

      <div className="hero-grid">
        <Link href="/pagamenti" className={`hero${nextPayment?.rata ? " alert" : ""}`}>
          <p className="eyebrow">Prossima scadenza</p>
          {nextPayment ? (
            <>
              <p className="hero-big">{nextPayment.amount ?? nextPayment.title}</p>
              <p className="hero-sub">{nextPayment.amount ? nextPayment.title : nextPayment.due ? "" : "Data non indicata"}</p>
              {nextPayment.due && <p className="hero-date">Entro il {longDate(nextPayment.due)}</p>}
            </>
          ) : <p className="hero-empty">Nessuna scadenza in arrivo</p>}
        </Link>

        <div className="hero">
          <p className="eyebrow">Prossima assemblea</p>
          {nextMeeting ? (
            <>
              <p className="hero-big">{longDate(nextMeeting.when)}</p>
              <p className="hero-sub">{nextMeeting.hasTime ? `Ore ${timeOf(nextMeeting.when)}` : nextMeeting.title}</p>
              {nextMeeting.item.location && <a className="hero-date link" href={mapsUrl(nextMeeting.item.location)} target="_blank" rel="noreferrer"><IconPin className="pin" />{nextMeeting.item.location}</a>}
            </>
          ) : (
            <>
              <p className="hero-empty">Nessuna assemblea in programma</p>
              {lastMeeting && <p className="hero-sub">Ultima: {shortDate(lastMeeting.when)}</p>}
            </>
          )}
        </div>
      </div>

      <section className="block compact">
        <div className="block-head"><h2>Comunicazioni importanti</h2><Link href="/comunicazioni">Tutte</Link></div>
        {important.length ? <div className="rows">{important.map((c) => <CommunicationRow key={c.item.external_id} c={c} />)}</div> : <p className="empty">Niente di importante negli ultimi mesi.</p>}
      </section>

      <section className="block compact">
        <div className="block-head"><h2>Documenti recenti</h2><Link href="/documenti">Tutti</Link></div>
        {documents.length ? <div className="rows">{documents.map((d) => <DocumentRow key={d.item.external_id} d={d} />)}</div> : <p className="empty">Nessun documento.</p>}
      </section>
    </div>
  );
}
