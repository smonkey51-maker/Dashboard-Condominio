import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await isAuthenticated()) redirect("/");
  const { error } = await searchParams;
  return (
    <main className="login-shell">
      <section className="login-card">
        <span className="brand-mark">E</span>
        <p className="eyebrow">EUGANEO CASA</p>
        <h1>La casa,<br />sotto controllo.</h1>
        <p>Dashboard privata per pagamenti, assemblee e documenti.</p>
        <form action="/api/login" method="post">
          <label htmlFor="password">Password familiare</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required autoFocus />
          {error && <span className="form-error">Password non corretta.</span>}
          <button type="submit">Accedi</button>
        </form>
        <small>I dati restano nel server privato.</small>
      </section>
    </main>
  );
}
