import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page" style={{ paddingTop: 96 }}>
      <h1>Elemento non trovato</h1>
      <p className="subtitle">Potrebbe essere stato rimosso dopo l’ultimo aggiornamento.</p>
      <Link className="button" href="/">Torna alla panoramica</Link>
    </main>
  );
}
