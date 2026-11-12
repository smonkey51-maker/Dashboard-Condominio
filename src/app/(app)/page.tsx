import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { communicationsOf, documentsOf, loadDashboard, longDate, mapsUrl, meetingsOf, paymentsOf, timeOf, upcomingMeetings } from "@/lib/view";
import { CommunicationRow, DocumentRow } from "../Rows";
import { IconPin } from "../icons";

export default async function Home() {
  const user = await getSessionUser();
  const { items } = await loadDashboard();
  const upcomingPayments = paymentsOf(items).filter((p) => !p.past);
  // Prefer a deadline with a known amount: it is the actionable one.
  const nextPayment = upcomingPayments.find((p) => p.amount) ?? upcomingPayments[0];
  const nextMeeting = upcomingMeetings(meetingsOf(items))[0];
  const communications = communicationsOf(items).slice(0, 3);
  const documents = documentsOf(items).slice(0, 3);

  return (
    <>
      <h1 className="greeting">Ciao{user ? `, ${user.name}` : ""}</h1>

      <div className="hero-grid">
        <section className={`hero${nextPayment?.rata ? " alert" : ""}`}>
          <p className="eyebrow">Prossima scadenza</p>
          {nextPayment ? (
            <>
              <p className="hero-big">{nextPayment.amount ?? nextPayment.title}</p>
              <p className="hero-sub">{nextPayment.amount ? nextPayment.title : ""}</p>
              <p className="hero-date">{nextPayment.due ? `Entro il ${longDate(nextPayment.due)}` : "Data non indicata"}</p>
            </>
          ) : <p className="hero-empty">Nessuna scadenza in arrivo.</p>}
          <Link className="hero-link" href="/pagamenti">Vedi pagamento →</Link>
        </section>

        <section className="hero">
          <p className="eyebrow">Prossima assemblea</p>
          {nextMeeting ? (
            <>
              <p className="hero-big">{longDate(nextMeeting.when)}</p>
              <p className="hero-sub">{nextMeeting.hasTime ? `Ore ${timeOf(nextMeeting.when)}` : nextMeeting.title}</p>
              {nextMeeting.item.location && <a className="hero-date" href={mapsUrl(nextMeeting.item.location)} target="_blank" rel="noreferrer"><IconPin className="pin" />{nextMeeting.item.location}</a>}
            </>
          ) : <p className="hero-empty">Nessuna assemblea in programma.</p>}
          <Link className="hero-link" href="/assemblee">Vedi assemblee →</Link>
        </section>
      </div>

      <section className="block">
        <div className="block-head"><h2>Ultime comunicazioni</h2><Link href="/comunicazioni">Vedi tutte</Link></div>
        {communications.length ? <div className="rows">{communications.map((c) => <CommunicationRow key={c.item.external_id} c={c} />)}</div> : <p className="empty">Nessuna comunicazione.</p>}
      </section>

      <section className="block">
        <div className="block-head"><h2>Documenti recenti</h2><Link href="/documenti">Vedi tutti</Link></div>
        {documents.length ? <div className="rows">{documents.map((d) => <DocumentRow key={d.item.external_id} d={d} />)}</div> : <p className="empty">Nessun documento.</p>}
      </section>
    </>
  );
}
