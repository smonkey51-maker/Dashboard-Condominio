import { IconPin } from "./icons";
import { longDate, mapsUrl, shortDate, timeOf, type Communication, type DocEntry, type Meeting, type Payment } from "@/lib/view";

function Row({ href, className, children }: { href: string | null; className?: string; children: React.ReactNode }) {
  const cls = `row${className ? ` ${className}` : ""}`;
  return href ? <a className={cls} href={href} target="_blank" rel="noreferrer">{children}</a> : <div className={cls}>{children}</div>;
}

export function PaymentRow({ p }: { p: Payment }) {
  const className = p.past ? "past" : p.rata ? "rata" : undefined;
  return (
    <Row href={p.item.source_url} className={className}>
      <span className="row-main">
        <span className="row-title">{p.rata && <em className="tag">Rata</em>}{p.title}</span>
        <span className="row-meta">{p.due ? `Scadenza ${longDate(p.due)}` : `Email del ${shortDate(p.item.occurred_at)}`}</span>
      </span>
      {p.amount && <span className="row-side amount">{p.amount}</span>}
    </Row>
  );
}

export function MeetingRow({ m }: { m: Meeting }) {
  return (
    <Row href={m.item.source_url} className={m.past ? "past" : undefined}>
      <span className="row-main">
        <span className="row-title">{m.title}</span>
        <span className="row-meta">
          {m.hasTime ? `Ore ${timeOf(m.when)}` : m.item.source === "calendar" ? "Calendar" : "Email"}
          {m.item.location && <> · <IconPin className="pin" /> {m.item.location}</>}
        </span>
      </span>
      <span className="row-side">{longDate(m.when)}</span>
    </Row>
  );
}

export function DocumentRow({ d }: { d: DocEntry }) {
  return (
    <Row href={d.item.source_url}>
      <span className="row-main">
        <span className="row-title">{d.title}</span>
        <span className="row-meta">{d.type}</span>
      </span>
      <span className="row-side">{shortDate(d.item.occurred_at)}</span>
    </Row>
  );
}

export function CommunicationRow({ c }: { c: Communication }) {
  return (
    <Row href={c.item.source_url}>
      <span className="row-main">
        <span className="row-title">{c.item.unread ? <i className="unread" aria-label="Da leggere" /> : null}{c.title}</span>
        <span className="row-meta">{c.type}</span>
      </span>
      <span className="row-side">{shortDate(c.item.occurred_at)}</span>
    </Row>
  );
}

export { mapsUrl };
