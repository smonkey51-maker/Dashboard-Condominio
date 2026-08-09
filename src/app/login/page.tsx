import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

const errors: Record<string, string> = {
  denied: "Questo account Google non è autorizzato ad accedere.",
  "1": "Accesso non riuscito. Riprova.",
};

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await isAuthenticated()) redirect("/");
  const { error } = await searchParams;
  return (
    <main className="login-shell">
      <section className="login-card rv">
        <span className="brand-mark rv">E</span>
        <p className="eyebrow rv">EUGANEO CASA</p>
        <h1 className="rv">La casa,<br />sotto controllo.</h1>
        <p className="rv">Dashboard privata per pagamenti, assemblee e documenti.</p>
        <div className="login-actions rv">
          <a className="button" href="/api/auth/google">Accedi con Google</a>
          {error && errors[error] && <span className="form-error">{errors[error]}</span>}
        </div>
        <small className="rv">I dati restano nel server privato.</small>
      </section>
    </main>
  );
}
