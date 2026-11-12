import { CONDOMINIO_IBAN, formatIban, loadDashboard, paymentsOf } from "@/lib/view";
import CopyButton from "../../CopyButton";
import { PaymentRow } from "../../Rows";

export default async function Pagamenti() {
  const { items } = await loadDashboard();
  const payments = paymentsOf(items);
  const upcoming = payments.filter((p) => !p.past);
  const past = payments.filter((p) => p.past);
  return (
    <>
      <h1>Pagamenti</h1>
      <p className="iban">Bonifico su <code>{formatIban(CONDOMINIO_IBAN)}</code><CopyButton className="copy" text={CONDOMINIO_IBAN} label="Copia IBAN" /></p>
      <section className="block">
        <div className="block-head"><h2>In arrivo</h2></div>
        {upcoming.length ? <div className="rows">{upcoming.map((p) => <PaymentRow key={p.item.external_id} p={p} />)}</div> : <p className="empty">Nessuna scadenza in arrivo.</p>}
      </section>
      {past.length > 0 && (
        <section className="block">
          <div className="block-head"><h2>Scadute</h2></div>
          <div className="rows">{past.map((p) => <PaymentRow key={p.item.external_id} p={p} />)}</div>
        </section>
      )}
    </>
  );
}
