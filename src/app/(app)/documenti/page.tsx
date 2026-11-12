import { documentsOf, loadDashboard } from "@/lib/view";
import { DocumentRow } from "../../Rows";

export default async function Documenti() {
  const { items } = await loadDashboard();
  const docs = documentsOf(items);
  return (
    <>
      <h1>Documenti</h1>
      <section className="block">
        {docs.length ? <div className="rows">{docs.map((d) => <DocumentRow key={d.item.external_id} d={d} />)}</div> : <p className="empty">Nessun documento.</p>}
      </section>
    </>
  );
}
