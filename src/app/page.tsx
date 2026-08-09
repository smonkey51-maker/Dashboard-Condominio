import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { dashboardData, type SyncedItem } from "@/lib/db";

export const dynamic = "force-dynamic";

function date(value: string) {
  return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function syncDate(value: string) {
  return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

const labels: Record<string, string> = {
  assembly: "Assemblea",
  payment: "Pagamento",
  document: "Documento",
  event: "Evento",
  update: "Aggiornamento",
};

function Item({ item }: { item: SyncedItem }) {
  const content = (
    <>
      <span className={`source-icon ${item.kind}`}>{item.source === "gmail" ? "M" : "C"}</span>
      <span className="item-copy"><strong>{item.title}</strong><small>{item.sender || item.location || labels[item.kind]}</small></span>
      <span className="item-date">{date(item.occurred_at)}{item.unread ? <em>Nuovo</em> : null}</span>
    </>
  );
  return item.source_url ? <a className="item-row" href={item.source_url} target="_blank" rel="noreferrer">{content}</a> : <div className="item-row">{content}</div>;
}

const notices: Record<string, { tone: "success" | "error"; text: string }> = {
  "google:connected": { tone: "success", text: "Google collegato. Premi \"Aggiorna ora\" per la prima sincronizzazione." },
  "google:error": { tone: "error", text: "Non è stato possibile collegare Google. Riprova." },
  "sync:ok": { tone: "success", text: "Sincronizzazione completata." },
  "sync:error": { tone: "error", text: "Sincronizzazione non riuscita. Riprova più tardi." },
};

export default async function Home({ searchParams }: { searchParams: Promise<{ google?: string; sync?: string }> }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");
  const { google, sync } = await searchParams;
  const notice = notices[`google:${google}`] || notices[`sync:${sync}`];
  const { items, lastRun, connected } = await dashboardData();
  const payments = items.filter((item) => item.kind === "payment");
  const meetings = items.filter((item) => item.kind === "assembly");
  const documents = items.filter((item) => item.kind === "document" || item.attachment_count > 0);
  const unread = items.filter((item) => item.unread).length;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#top"><span className="brand-mark">E</span><span>Euganeo Casa</span></a>
        <nav>
          <a className="active" href="#panoramica">⌂ Panoramica</a>
          <a href="#pagamenti">€ Pagamenti</a>
          <a href="#assemblee">◫ Assemblee</a>
          <a href="#documenti">▱ Documenti</a>
          <a href="#aggiornamenti">↻ Aggiornamenti</a>
        </nav>
        <div className="sidebar-foot">
          <div className="sync-status"><span className={connected ? "dot live" : "dot"} /><div><strong>{connected ? "Google collegato" : "Google da collegare"}</strong><small>{lastRun ? `Aggiornato ${syncDate(lastRun.synced_at)}` : "Sola lettura"}</small></div></div>
          <div className="sync-status"><span className="dot live" /><div><strong>{sessionUser.name}</strong><small>Utente collegato</small></div></div>
          <form action="/api/logout" method="post"><button className="link-button">Esci</button></form>
        </div>
      </aside>

      <nav className="pill-nav" aria-label="Navigazione principale">
        <a className="active" href="#panoramica" aria-label="Panoramica">⌂</a>
        <a href="#pagamenti" aria-label="Pagamenti">€</a>
        <a href="#assemblee" aria-label="Assemblee">◫</a>
        <a href="#documenti" aria-label="Documenti">▱</a>
        <a href="#aggiornamenti" aria-label="Aggiornamenti">↻</a>
      </nav>

      <section className="content" id="top">
        <header><strong className="mobile-logo">Euganeo Casa</strong><span>{lastRun ? `Aggiornato ${syncDate(lastRun.synced_at)}` : "In attesa del primo aggiornamento"}</span></header>
        <div className="page-wrap">
          {notice && <div className={`notice ${notice.tone}`}>{notice.text}</div>}
          <section className="intro" id="panoramica">
            <div><p className="eyebrow">DASHBOARD PRIVATA</p><h1>La casa, sotto controllo.</h1><p>Pagamenti, assemblee e documenti del Condominio Euganeo, in un unico posto.</p></div>
            <span className="privacy-pill">● Solo famiglia</span>
          </section>

          <section className="metrics">
            <article className="metric primary"><span>Pagamenti rilevati</span><strong>{payments.length}</strong><small>Dalle comunicazioni Gmail</small></article>
            <article className="metric"><span>Assemblee</span><strong>{meetings.length}</strong><small>Email ed eventi Calendar</small></article>
            <article className="metric"><span>Da leggere</span><strong>{unread}</strong><small>Aggiornamenti non letti</small></article>
          </section>

          {!connected ? (
            <section className="connect-card">
              <div><p className="eyebrow">UN SOLO COLLEGAMENTO</p><h2>Collega Gmail e Calendar</h2><p>Autorizza una volta l’account Google. La webapp userà esclusivamente permessi in sola lettura e si aggiornerà una volta al giorno.</p></div>
              <a className="button" href="/api/google/connect">Collega Google ↗</a>
            </section>
          ) : (
            <section className="connect-card connected">
              <div><p className="eyebrow">SINCRONIZZAZIONE ATTIVA</p><h2>Gmail e Calendar collegati</h2><p>Il server controlla automaticamente una volta al giorno. Puoi anche aggiornare adesso.</p></div>
              <form action="/api/sync" method="post"><button className="button">Aggiorna ora ↻</button></form>
            </section>
          )}

          <section className="panel" id="aggiornamenti">
            <div className="panel-head"><div><p className="eyebrow">ULTIME ATTIVITÀ</p><h2>Aggiornamenti</h2></div><span>{items.length} elementi</span></div>
            {items.length ? <div className="item-list">{items.slice(0, 12).map((item) => <Item key={`${item.source}-${item.external_id}`} item={item} />)}</div> : <div className="empty"><strong>Nessun dato salvato</strong><p>Dopo il collegamento, qui appariranno soltanto i messaggi e gli eventi relativi a Euganeo.</p></div>}
          </section>

          <div className="grid-two">
            <section className="panel" id="pagamenti"><div className="panel-head"><div><p className="eyebrow">SCADENZE</p><h2>Pagamenti</h2></div><span>{payments.length}</span></div>{payments.length ? payments.slice(0, 6).map((item) => <Item key={`${item.source}-${item.external_id}`} item={item} />) : <div className="empty small">Nessun pagamento rilevato.</div>}</section>
            <section className="panel" id="assemblee"><div className="panel-head"><div><p className="eyebrow">RIUNIONI</p><h2>Assemblee</h2></div><span>{meetings.length}</span></div>{meetings.length ? meetings.slice(0, 6).map((item) => <Item key={`${item.source}-${item.external_id}`} item={item} />) : <div className="empty small">Nessuna assemblea rilevata.</div>}</section>
          </div>

          <section className="panel" id="documenti"><div className="panel-head"><div><p className="eyebrow">ALLEGATI</p><h2>Documenti</h2></div><span>{documents.length}</span></div>{documents.length ? <div className="item-list">{documents.slice(0, 8).map((item) => <Item key={`${item.source}-${item.external_id}`} item={item} />)}</div> : <div className="empty small">Nessun documento rilevato.</div>}</section>

          <footer>Le email complete e gli allegati non vengono copiati: la dashboard conserva solo oggetto, mittente, data, breve anteprima e collegamento originale.</footer>
        </div>
      </section>
    </main>
  );
}
