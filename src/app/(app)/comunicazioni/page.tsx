import Link from "next/link";
import { CommunicationRow } from "../../Rows";
import { communicationsOf, filterGroups, loadDashboard, matchesQuery } from "@/lib/view";

export default async function Comunicazioni({ searchParams }: { searchParams: Promise<{ q?: string; cat?: string }> }) {
  const { q = "", cat = "" } = await searchParams;
  const { items } = await loadDashboard();
  const group = filterGroups.find((g) => g.id === cat);
  const list = communicationsOf(items).filter((c) => matchesQuery(c.item, c.title, q) && (!group || group.match(c.kind)));
  const href = (id: string) => `/comunicazioni?${new URLSearchParams({ ...(q ? { q } : {}), ...(id ? { cat: id } : {}) }).toString()}`;

  return (
    <>
      <h1>Comunicazioni</h1>
      <form className="filters" method="get" role="search">
        <input type="search" name="q" defaultValue={q} placeholder="Cerca nelle comunicazioni" aria-label="Cerca comunicazioni" />
        {cat && <input type="hidden" name="cat" value={cat} />}
        <button type="submit" className="button">Cerca</button>
      </form>
      <nav className="chips" aria-label="Categoria">
        <Link href={href("")} className={!group ? "active" : undefined}>Tutte</Link>
        {filterGroups.map((g) => <Link key={g.id} href={href(g.id)} className={group?.id === g.id ? "active" : undefined}>{g.label}</Link>)}
      </nav>
      <p className="subtitle">{list.length} comunicazion{list.length === 1 ? "e" : "i"}</p>
      {list.length ? <div className="rows">{list.map((c) => <CommunicationRow key={`${c.item.source}-${c.item.external_id}`} c={c} />)}</div> : <p className="empty">Nessuna comunicazione corrisponde alla ricerca.</p>}
    </>
  );
}
