import { redirect } from "next/navigation";
import { APP_USERS, isAuthenticated } from "@/lib/auth";

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
          <label htmlFor="user">Chi accede?</label>
          <select id="user" name="user" required autoFocus defaultValue="">
            <option value="" disabled>Seleziona...</option>
            {APP_USERS.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
          </select>
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required />
          {error && <span className="form-error">Utente o password non corretti.</span>}
          <button type="submit">Accedi</button>
        </form>
        <small>I dati restano nel server privato.</small>
      </section>
    </main>
  );
}
