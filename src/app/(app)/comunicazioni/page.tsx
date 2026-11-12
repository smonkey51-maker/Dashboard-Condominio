import { communicationsOf, loadDashboard } from "@/lib/view";
import { CommunicationRow } from "../../Rows";

export default async function Comunicazioni() {
  const { items } = await loadDashboard();
  const list = communicationsOf(items);
  return (
    <>
      <h1>Comunicazioni</h1>
      <section className="block">
        {list.length ? <div className="rows">{list.map((c) => <CommunicationRow key={c.item.external_id} c={c} />)}</div> : <p className="empty">Nessuna comunicazione.</p>}
      </section>
    </>
  );
}
