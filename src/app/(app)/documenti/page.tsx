import Link from "next/link";
import { DocumentRow } from "../../Rows";
import { documentsOf, loadDashboard, matchesQuery } from "@/lib/view";

type Params = { q?: string; anno?: string; tipo?: string; ord?: string };

export default async function Documenti({ searchParams }: { searchParams: Promise<Params> }) {
  const { q = "", anno = "", tipo = "", ord = "recenti" } = await searchParams;
  const { items } = await loadDashboard();
  const all = documentsOf(items);
  const years = [...new Set(all.map((d) => d.year))].sort((a, b) => b - a);
  const types = [...new Set(all.map((d) => d.type))].sort();

  let docs = all.filter((d) => matchesQuery(d.item, d.title, q) && (!anno || String(d.year) === anno) && (!tipo || d.type === tipo));
  if (ord === "vecchi") docs = [...docs].reverse();
  if (ord === "titolo") docs = [...docs].sort((a, b) => a.title.localeCompare(b.title, "it"));
  const filtered = Boolean(q || anno || tipo);

  return (
    <>
      <h1>Documenti</h1>
      <form className="filters" method="get" role="search">
        <input type="search" name="q" defaultValue={q} placeholder="Cerca per titolo o contenuto" aria-label="Cerca documenti" />
        <select name="anno" defaultValue={anno} aria-label="Anno"><option value="">Tutti gli anni</option>{years.map((y) => <option key={y} value={y}>{y}</option>)}</select>
        <select name="tipo" defaultValue={tipo} aria-label="Tipologia"><option value="">Tutte le tipologie</option>{types.map((t) => <option key={t} value={t}>{t}</option>)}</select>
        <select name="ord" defaultValue={ord} aria-label="Ordinamento">
          <option value="recenti">Più recenti</option><option value="vecchi">Meno recenti</option><option value="titolo">Titolo A–Z</option>
        </select>
        <button type="submit" className="button">Applica</button>
      </form>
      <p className="subtitle">
        {docs.length} document{docs.length === 1 ? "o" : "i"}{filtered ? " trovati" : ""}
        {filtered && <> · <Link href="/documenti">Azzera filtri</Link></>}
      </p>
      {docs.length ? <div className="rows">{docs.map((d) => <DocumentRow key={d.item.external_id} d={d} />)}</div> : <p className="empty">Nessun documento corrisponde alla ricerca.</p>}
    </>
  );
}
