import Link from "next/link";
import { IconBell, IconChevron, IconCoin, IconFile, IconUsers, IconWrench } from "./icons";
import { categoryLabels, itemRef, longDate, paymentStatusLabels, shortDate, timeOf, type Category, type Communication, type DocEntry, type Meeting, type Payment } from "@/lib/view";

const icons: Record<string, React.ComponentType<{ className?: string }>> = {
  payment: IconCoin, assembly: IconUsers, document: IconFile, maintenance: IconWrench, update: IconBell, event: IconUsers,
};

export function CategoryIcon({ kind }: { kind: Category | string }) {
  const Icon = icons[kind] ?? IconBell;
  return <span className={`row-icon ${kind === "payment" ? "attention" : ""}`}><Icon /></span>;
}

function Row({ item, kind, className, children, side }: { item: Parameters<typeof itemRef>[0]; kind: string; className?: string; children: React.ReactNode; side?: React.ReactNode }) {
  return (
    <Link href={`/dettaglio/${itemRef(item)}`} className={`row${className ? ` ${className}` : ""}`}>
      <CategoryIcon kind={kind} />
      <span className="row-main">{children}</span>
      {side && <span className="row-side">{side}</span>}
      <IconChevron className="chev" />
    </Link>
  );
}

export function PaymentRow({ p }: { p: Payment }) {
  return (
    <Row item={p.item} kind="payment" className={`${p.status === "superata" || p.section === "storico" ? "muted" : ""}`}
      side={p.amount ? <span className="amount">{p.amount}</span> : undefined}>
      <span className="row-title">{p.title}</span>
      {p.due && <span className="row-meta">Scadenza {shortDate(p.due)}</span>}
      <span className="row-chip"><span className={`chip ${p.status}`}>{paymentStatusLabels[p.status]}</span></span>
    </Row>
  );
}

export function MeetingRow({ m }: { m: Meeting }) {
  return (
    <Row item={m.item} kind="assembly" className={m.past ? "muted" : ""}>
      <span className="row-title">{m.title}</span>
      <span className="row-meta">
        {m.whenKnown ? `${longDate(m.when)}${m.hasTime ? ` · ore ${timeOf(m.when)}` : ""}` : `Data da verificare · email del ${shortDate(m.item.occurred_at)}`}
        {m.item.location ? ` · ${m.item.location}` : ""}
      </span>
    </Row>
  );
}

export function DocumentRow({ d }: { d: DocEntry }) {
  return (
    <Row item={d.item} kind="document" side={d.item.attachment_count > 0 ? `${d.item.attachment_count} all.` : undefined}>
      <span className="row-title">{d.title}</span>
      <span className="row-meta">{d.type} · {shortDate(d.item.occurred_at)}</span>
    </Row>
  );
}

export function CommunicationRow({ c }: { c: Communication }) {
  return (
    <Row item={c.item} kind={c.kind} className={c.item.unread ? "unread-row" : ""}>
      <span className="row-title">{c.item.unread ? <i className="unread" aria-label="Da leggere" /> : null}{c.title}</span>
      <span className="row-meta">{categoryLabels[c.kind] ?? c.type} · {shortDate(c.item.occurred_at)}</span>
    </Row>
  );
}
