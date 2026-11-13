import { CONDOMINIO_IBAN, formatIban, loadDashboard, maskIban, paymentsOf } from "@/lib/view";
import IbanBox from "../../IbanBox";
import { PaymentRow } from "../../Rows";

export default async function Pagamenti() {
  const { items } = await loadDashboard();
  const payments = paymentsOf(items);
  const arrivo = payments.filter((p) => p.section === "arrivo");
  const superata = payments.filter((p) => p.section === "superata");
  const storico = payments.filter((p) => p.section === "storico");
  const known = payments.filter((p) => p.due).length;
  const toCheck = payments.filter((p) => p.status === "da-verificare").length;

  return (
    <>
      <h1>Pagamenti</h1>
      <p className="subtitle">
        {payments.length ? `${known} scadenz${known === 1 ? "a nota" : "e note"}${toCheck ? ` · ${toCheck} da verificare` : ""}` : "Nessuna scadenza rilevata"}
        {payments.length ? " · dati letti dalle email, non da estratti conto" : ""}
      </p>
      <IbanBox masked={maskIban(CONDOMINIO_IBAN)} full={CONDOMINIO_IBAN.replace(/\s+/g, "")} display={formatIban(CONDOMINIO_IBAN)} />

      <section className="block">
        <div className="block-head"><h2>In arrivo</h2></div>
        {arrivo.length ? <div className="rows">{arrivo.map((p) => <PaymentRow key={p.item.external_id} p={p} />)}</div> : <p className="empty">Nessuna scadenza in arrivo.</p>}
      </section>
      {superata.length > 0 && (
        <section className="block">
          <div className="block-head"><h2>Scadenza superata</h2></div>
          <p className="note">La data è passata, ma questo non significa che il pagamento manchi: l’app non ha una prova di pagamento. Verifica con il tuo estratto conto.</p>
          <div className="rows">{superata.map((p) => <PaymentRow key={p.item.external_id} p={p} />)}</div>
        </section>
      )}
      {storico.length > 0 && (
        <section className="block">
          <div className="block-head"><h2>Storico</h2></div>
          <div className="rows">{storico.map((p) => <PaymentRow key={p.item.external_id} p={p} />)}</div>
        </section>
      )}
    </>
  );
}
