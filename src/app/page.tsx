import { Fragment } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { dashboardData, type SyncedItem } from "@/lib/db";
import { IconBell, IconClose, IconCoin, IconFile, IconHome, IconPin, IconRefresh, IconSettings, IconUsers } from "./icons";
import CopyButton from "./CopyButton";
import RowMenu from "./RowMenu";
import ExpandableList from "./ExpandableList";
import OfflineIndicator from "./OfflineIndicator";

export const dynamic = "force-dynamic";

const navItems = [
  { id: "panoramica", label: "Panoramica", Icon: IconHome },
  { id: "pagamenti", label: "Pagamenti", Icon: IconCoin },
  { id: "assemblee", label: "Assemblee", Icon: IconUsers },
  { id: "documenti", label: "Documenti", Icon: IconFile },
  { id: "aggiornamenti", label: "Aggiornamenti", Icon: IconBell },
];

const mobileNavItems = [...navItems, { id: "impostazioni", label: "Impostazioni", Icon: IconSettings }];

function date(value: string) {
  return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function syncDate(value: string) {
  return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function meetingDate(value: string) {
  return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function mapsUrl(location: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

function formatIban(iban: string) {
  return iban.replace(/\s+/g, "").match(/.{1,4}/g)?.join(" ") ?? iban;
}

function sortedWithNowDivider(meetings: SyncedItem[]) {
  const sorted = [...meetings].sort((a, b) => a.occurred_at.localeCompare(b.occurred_at));
  const nowIso = new Date().toISOString();
  const dividerIndex = sorted.findIndex((m) => m.occurred_at >= nowIso);
  return { sorted, dividerIndex };
}

const IMPORTANT_DOC_PATTERN = /verbale|convocazione|bilancio|regolamento|delibera/i;
function isImportantDoc(item: SyncedItem) {
  return IMPORTANT_DOC_PATTERN.test(item.title);
}

const labels: Record<string, string> = {
  assembly: "Assemblea",
  payment: "Pagamento",
  document: "Documento",
  event: "Evento",
  update: "Aggiornamento",
};

function Item({ item, spotlight, important }: { item: SyncedItem; spotlight?: boolean; important?: boolean }) {
  const highlight = spotlight || important;
  const content = (
    <>
      <span className={`source-icon ${item.kind}`}>{item.source === "gmail" ? "M" : "C"}</span>
      <span className="item-copy"><strong>{item.title}</strong><small>{item.sender || item.location || labels[item.kind]}</small></span>
      <span className="item-date">
        {date(item.occurred_at)}
        {important ? <em className="important">Importante</em> : null}
        {item.unread ? <em>Nuovo</em> : null}
      </span>
    </>
  );
  const row = item.source_url ? (
    <a className={`item-row${highlight ? " spotlight" : ""}`} href={item.source_url} target="_blank" rel="noreferrer">{content}</a>
  ) : (
    <div className={`item-row${highlight ? " spotlight" : ""}`}>{content}</div>
  );
  return (
    <div className="item-row-shell">
      {row}
      <RowMenu url={item.source_url} />
    </div>
  );
}

function readableText(item: SyncedItem) {
  const summary = (item.summary || "").trim();
  const isBoilerplate = !summary || /preheader|unsubscribe|view (this|in) (the )?(email|browser)/i.test(summary);
  return isBoilerplate ? item.title : summary;
}

function MeetingItem({ item }: { item: SyncedItem }) {
  return (
    <div className="meeting-row">
      <span className="meeting-date">{meetingDate(item.occurred_at)}</span>
      <span className="meeting-body">
        <span className="meeting-desc">{readableText(item)}</span>
        {item.location && (
          <a className="meeting-location" href={mapsUrl(item.location)} target="_blank" rel="noreferrer">
            <IconPin className="pin-icon" />{item.location}
          </a>
        )}
      </span>
      {item.source_url && <a className="meeting-open" href={item.source_url} target="_blank" rel="noreferrer">Apri ↗</a>}
    </div>
  );
}

const CONDOMINIO_IBAN = "IT10S0306912139100000010025";

function PaymentItem({ item }: { item: SyncedItem }) {
  const content = (
    <>
      <span className="payment-reason">{readableText(item)}</span>
      <span className="payment-date">{date(item.occurred_at)}</span>
    </>
  );
  return item.source_url ? <a className="payment-row" href={item.source_url} target="_blank" rel="noreferrer">{content}</a> : <div className="payment-row">{content}</div>;
}

function OverlayClose() {
  return <a className="overlay-close" href="#top" aria-label="Chiudi"><IconClose /></a>;
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
  const { sorted: meetingsAgenda, dividerIndex } = sortedWithNowDivider(meetings);

  return (
    <main className="app-shell">
      <OfflineIndicator items={items} />
      <aside className="sidebar">
        <a className="brand" href="#top"><span className="brand-mark">E</span><span>Euganeo Casa</span></a>
        <nav>
          {navItems.map(({ id, label, Icon }) => (
            <a key={id} className={id === "panoramica" ? "active" : undefined} href={`#${id}`}>
              <Icon className="nav-icon" />
              {label}
            </a>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="sync-status"><span className={connected ? "dot live" : "dot"} /><div><strong>{connected ? "Google collegato" : "Google da collegare"}</strong><small>{lastRun ? `Aggiornato ${syncDate(lastRun.synced_at)}` : "Sola lettura"}</small></div></div>
          <div className="sync-status"><span className="dot live" /><div><strong>{sessionUser.name}</strong><small>Utente collegato</small></div></div>
          <form action="/api/logout" method="post"><button className="link-button">Esci</button></form>
        </div>
      </aside>

      <nav className="pill-nav" aria-label="Navigazione principale">
        {mobileNavItems.map(({ id, label, Icon }) => (
          <a key={id} className={id === "panoramica" ? "active" : undefined} href={`#${id}`} aria-label={label}>
            <Icon />
            <span className="pill-label">{label}</span>
          </a>
        ))}
      </nav>

      {connected && (
        <form action="/api/sync" method="post" className="fab-form">
          <button type="submit" className="fab" aria-label="Aggiorna ora"><IconRefresh /></button>
        </form>
      )}

      <section className="content" id="top">
        <header>
          <strong className="mobile-logo">Euganeo Casa</strong>
          <div className="header-actions">
            {lastRun && <span className="sync-pill">{`Aggiornato ${syncDate(lastRun.synced_at)}`}</span>}
            <a className="bell-button" href="#aggiornamenti" aria-label="Aggiornamenti">
              <IconBell />
              {unread > 0 && <span className="bell-badge">{unread > 9 ? "9+" : unread}</span>}
            </a>
          </div>
        </header>
        <div className="page-wrap">
          {notice && <div className={`notice ${notice.tone}`}>{notice.text}</div>}

          <section className="hero-tile rv" id="panoramica">
            <p className="eyebrow">DASHBOARD PRIVATA</p>
            <h1>La casa, sotto controllo.</h1>
            <p>Pagamenti, assemblee e documenti del Condominio Euganeo, in un unico posto.</p>
            <span className="privacy-pill"><span className="privacy-dot" />Solo famiglia</span>
          </section>

          <div className="bento-grid">
            <a className="bento-tile primary rv" href="#pagamenti">
              <span className="icon-badge"><IconCoin /></span>
              <span className="bento-count">{payments.length}</span>
              <span className="bento-copy"><strong>Pagamenti</strong><p>Scadenze dalle comunicazioni Gmail</p></span>
            </a>
            <a className="bento-tile rv" href="#assemblee">
              <span className="icon-badge"><IconUsers /></span>
              <span className="bento-count">{meetings.length}</span>
              <span className="bento-copy"><strong>Assemblee</strong><p>Email ed eventi Calendar</p></span>
            </a>
            <a className="bento-tile rv" href="#documenti">
              <span className="icon-badge"><IconFile /></span>
              <span className="bento-count">{documents.length}</span>
              <span className="bento-copy"><strong>Documenti</strong><p>Allegati e circolari</p></span>
            </a>
            <a className="bento-tile rv" href="#aggiornamenti">
              <span className="icon-badge"><IconBell /></span>
              {unread > 0 ? <span className="bento-badge">{unread > 9 ? "9+" : unread}</span> : <span className="bento-count">{items.length}</span>}
              <span className="bento-copy"><strong>Aggiornamenti</strong><p>{unread > 0 ? `${unread} da leggere` : "Tutto letto"}</p></span>
            </a>
          </div>

          <p className="area-label rv">AREA PERSONALE</p>
          <div className="bento-grid personal" id="impostazioni">
            <div className="bento-tile plain rv">
              <span className="bento-copy"><strong>{connected ? "Gmail e Calendar collegati" : "Collega Gmail e Calendar"}</strong><p>{connected ? "Il server controlla automaticamente una volta al giorno." : "Autorizza una volta l’account Google, in sola lettura."}</p></span>
              {connected ? (
                <form action="/api/sync" method="post"><button className="button ghost small" type="submit">Aggiorna ora ↻</button></form>
              ) : (
                <a className="button small" href="/api/google/connect">Collega Google ↗</a>
              )}
            </div>
            <div className="bento-tile plain rv">
              <span className="icon-badge"><IconSettings /></span>
              <span className="bento-copy"><strong>{sessionUser.name}</strong><p>{lastRun ? `Aggiornato ${syncDate(lastRun.synced_at)}` : "Sola lettura"}</p></span>
              <form action="/api/logout" method="post"><button className="button ghost small" type="submit">Esci</button></form>
            </div>
          </div>

          <section className="panel section-overlay" id="pagamenti">
            <div className="panel-head"><div><p className="eyebrow">SCADENZE</p><h2><span className="icon-badge"><IconCoin /></span>Pagamenti</h2></div><span>{payments.length}</span><OverlayClose /></div>
            <p className="payment-iban">Bonifico su <code>{formatIban(CONDOMINIO_IBAN)}</code><CopyButton className="iban-copy" text={CONDOMINIO_IBAN} label="Copia IBAN" /></p>
            {payments.length ? <div className="item-list"><ExpandableList initial={6}>{payments.map((item) => <PaymentItem key={`${item.source}-${item.external_id}`} item={item} />)}</ExpandableList></div> : <div className="empty small">Nessun pagamento rilevato.</div>}
          </section>

          <section className="panel section-overlay" id="assemblee">
            <div className="panel-head"><div><p className="eyebrow">RIUNIONI</p><h2><span className="icon-badge"><IconUsers /></span>Assemblee</h2></div><span>{meetings.length}</span><OverlayClose /></div>
            {meetings.length ? (
              <div className="item-list">
                {meetingsAgenda.map((item, i) => (
                  <Fragment key={`${item.source}-${item.external_id}`}>
                    {i === dividerIndex && dividerIndex > 0 && <div className="now-divider"><span>Adesso</span></div>}
                    <MeetingItem item={item} />
                  </Fragment>
                ))}
              </div>
            ) : <div className="empty small">Nessuna assemblea rilevata.</div>}
          </section>

          <section className="panel section-overlay" id="documenti">
            <div className="panel-head"><div><p className="eyebrow">ALLEGATI</p><h2><span className="icon-badge"><IconFile /></span>Documenti</h2></div><span>{documents.length}</span><OverlayClose /></div>
            {documents.length ? <div className="item-list"><ExpandableList initial={8}>{documents.map((item) => <Item key={`${item.source}-${item.external_id}`} item={item} important={isImportantDoc(item)} />)}</ExpandableList></div> : <div className="empty small">Nessun documento rilevato.</div>}
          </section>

          <section className="panel section-overlay" id="aggiornamenti">
            <div className="panel-head"><div><p className="eyebrow">ULTIME ATTIVITÀ</p><h2><span className="icon-badge"><IconBell /></span>Aggiornamenti</h2></div><span>{items.length} elementi</span><OverlayClose /></div>
            {items.length ? <div className="item-list"><ExpandableList initial={12}>{items.map((item, i) => <Item key={`${item.source}-${item.external_id}`} item={item} spotlight={i === 0 && Boolean(item.unread)} />)}</ExpandableList></div> : <div className="empty"><strong>Nessun dato salvato</strong><p>Dopo il collegamento, qui appariranno soltanto i messaggi e gli eventi relativi a Euganeo.</p></div>}
          </section>

          <footer>Le email complete e gli allegati non vengono copiati: la dashboard conserva solo oggetto, mittente, data, breve anteprima e collegamento originale.</footer>
        </div>
      </section>
    </main>
  );
}
