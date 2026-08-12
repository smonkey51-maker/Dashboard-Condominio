import { Fragment } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { dashboardData, type SyncedItem } from "@/lib/db";
import { IconBell, IconCoin, IconFile, IconHome, IconLink, IconPin, IconRefresh, IconSettings, IconUsers } from "./icons";
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

function dayStrip(meetings: SyncedItem[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekdayFmt = new Intl.DateTimeFormat("it-IT", { weekday: "short" });
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - 2 + i);
    return {
      key: d.toDateString(),
      day: d.getDate(),
      weekday: weekdayFmt.format(d).replace(".", "").toUpperCase(),
      isToday: d.getTime() === today.getTime(),
      hasMeeting: meetings.some((m) => new Date(m.occurred_at).toDateString() === d.toDateString()),
    };
  });
}

function sortedWithNowDivider(meetings: SyncedItem[]) {
  const sorted = [...meetings].sort((a, b) => a.occurred_at.localeCompare(b.occurred_at));
  const nowIso = new Date().toISOString();
  const dividerIndex = sorted.findIndex((m) => m.occurred_at >= nowIso);
  return { sorted, dividerIndex };
}

const labels: Record<string, string> = {
  assembly: "Assemblea",
  payment: "Pagamento",
  document: "Documento",
  event: "Evento",
  update: "Aggiornamento",
};

function Item({ item, spotlight }: { item: SyncedItem; spotlight?: boolean }) {
  const content = (
    <>
      <span className={`source-icon ${item.kind}`}>{item.source === "gmail" ? "M" : "C"}</span>
      <span className="item-copy"><strong>{item.title}</strong><small>{item.sender || item.location || labels[item.kind]}</small></span>
      <span className="item-date">{date(item.occurred_at)}{item.unread ? <em>Nuovo</em> : null}</span>
    </>
  );
  const row = item.source_url ? (
    <a className={`item-row${spotlight ? " spotlight" : ""}`} href={item.source_url} target="_blank" rel="noreferrer">{content}</a>
  ) : (
    <div className={`item-row${spotlight ? " spotlight" : ""}`}>{content}</div>
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
          <section className="intro rv" id="panoramica" data-tab="panoramica">
            <div><p className="eyebrow">DASHBOARD PRIVATA</p><h1>La casa, sotto controllo.</h1><p>Pagamenti, assemblee e documenti del Condominio Euganeo, in un unico posto.</p></div>
            <span className="privacy-pill">● Solo famiglia</span>
          </section>

          <section className="metrics" data-tab="panoramica">
            <a className="metric primary rv" href="#pagamenti"><span className="icon-badge"><IconCoin /></span><span>Pagamenti rilevati</span><strong>{payments.length}</strong><small>Dalle comunicazioni Gmail</small></a>
            <a className="metric rv" href="#assemblee"><span className="icon-badge"><IconUsers /></span><span>Assemblee</span><strong>{meetings.length}</strong><small>Email ed eventi Calendar</small></a>
            <a className="metric rv" href="#aggiornamenti"><span className="icon-badge"><IconBell /></span><span>Da leggere</span><strong>{unread}</strong><small>Aggiornamenti non letti</small></a>
          </section>

          {!connected ? (
            <section className="connect-card rv" data-tab="panoramica">
              <div><p className="eyebrow">UN SOLO COLLEGAMENTO</p><h2><span className="icon-badge"><IconLink /></span>Collega Gmail e Calendar</h2><p>Autorizza una volta l’account Google. La webapp userà esclusivamente permessi in sola lettura e si aggiornerà una volta al giorno.</p></div>
              <a className="button" href="/api/google/connect">Collega Google ↗</a>
            </section>
          ) : (
            <section className="connect-card connected rv" data-tab="panoramica">
              <div><p className="eyebrow">SINCRONIZZAZIONE ATTIVA</p><h2><span className="icon-badge"><IconLink /></span>Gmail e Calendar collegati</h2><p>Il server controlla automaticamente una volta al giorno. Puoi anche aggiornare adesso.</p></div>
              <form action="/api/sync" method="post"><button className="button">Aggiorna ora ↻</button></form>
            </section>
          )}

          <div className="grid-two">
            <section className="panel rv" id="pagamenti" data-tab="pagamenti">
              <div className="panel-head"><div><p className="eyebrow">SCADENZE</p><h2><span className="icon-badge"><IconCoin /></span>Pagamenti</h2></div><span>{payments.length}</span></div>
              <p className="payment-iban">Bonifico su <code>{formatIban(CONDOMINIO_IBAN)}</code><CopyButton className="iban-copy" text={CONDOMINIO_IBAN} label="Copia IBAN" /></p>
              {payments.length ? <div className="item-list"><ExpandableList initial={6}>{payments.map((item) => <PaymentItem key={`${item.source}-${item.external_id}`} item={item} />)}</ExpandableList></div> : <div className="empty small">Nessun pagamento rilevato.</div>}
            </section>
            <section className="panel rv" id="assemblee" data-tab="assemblee">
              <div className="panel-head"><div><p className="eyebrow">RIUNIONI</p><h2><span className="icon-badge"><IconUsers /></span>Assemblee</h2></div><span>{meetings.length}</span></div>
              {meetings.length ? (
                <>
                  <div className="day-strip">
                    {dayStrip(meetings).map((d) => (
                      <div key={d.key} className={`day-cell${d.isToday ? " today" : ""}`}>
                        <span className="day-num">{d.day}</span>
                        <span className="day-name">{d.weekday}</span>
                        {d.hasMeeting && <span className="day-dot" />}
                      </div>
                    ))}
                  </div>
                  <div className="item-list">
                    {meetingsAgenda.slice(0, 6).map((item, i) => (
                      <Fragment key={`${item.source}-${item.external_id}`}>
                        {i === dividerIndex && dividerIndex > 0 && <div className="now-divider"><span>Adesso</span></div>}
                        <MeetingItem item={item} />
                      </Fragment>
                    ))}
                  </div>
                </>
              ) : <div className="empty small">Nessuna assemblea rilevata.</div>}
            </section>
          </div>

          <section className="panel rv" id="documenti" data-tab="documenti"><div className="panel-head"><div><p className="eyebrow">ALLEGATI</p><h2><span className="icon-badge"><IconFile /></span>Documenti</h2></div><span>{documents.length}</span></div>{documents.length ? <div className="item-list"><ExpandableList initial={8}>{documents.map((item) => <Item key={`${item.source}-${item.external_id}`} item={item} />)}</ExpandableList></div> : <div className="empty small">Nessun documento rilevato.</div>}</section>

          <section className="panel rv" id="aggiornamenti" data-tab="aggiornamenti">
            <div className="panel-head"><div><p className="eyebrow">ULTIME ATTIVITÀ</p><h2><span className="icon-badge"><IconBell /></span>Aggiornamenti</h2></div><span>{items.length} elementi</span></div>
            {items.length ? <div className="item-list"><ExpandableList initial={5}>{items.map((item, i) => <Item key={`${item.source}-${item.external_id}`} item={item} spotlight={i === 0 && Boolean(item.unread)} />)}</ExpandableList></div> : <div className="empty"><strong>Nessun dato salvato</strong><p>Dopo il collegamento, qui appariranno soltanto i messaggi e gli eventi relativi a Euganeo.</p></div>}
          </section>

          <section className="panel account-panel mobile-only rv" id="impostazioni" data-tab="impostazioni">
            <div className="panel-head"><div><p className="eyebrow">ACCOUNT</p><h2><span className="icon-badge"><IconSettings /></span>Impostazioni</h2></div></div>
            <div className="account-rows">
              <div className="sync-status"><span className={connected ? "dot live" : "dot"} /><div><strong>{connected ? "Google collegato" : "Google da collegare"}</strong><small>{lastRun ? `Aggiornato ${syncDate(lastRun.synced_at)}` : "Sola lettura"}</small></div></div>
              <div className="sync-status"><span className="dot live" /><div><strong>{sessionUser.name}</strong><small>Utente collegato</small></div></div>
            </div>
            <form action="/api/logout" method="post"><button className="button ghost" type="submit">Esci</button></form>
          </section>

          <footer>Le email complete e gli allegati non vengono copiati: la dashboard conserva solo oggetto, mittente, data, breve anteprima e collegamento originale.</footer>
        </div>
      </section>
    </main>
  );
}
