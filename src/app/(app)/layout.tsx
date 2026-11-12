import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { loadDashboard, syncLabel } from "@/lib/view";
import AutoSync from "../AutoSync";
import NavLinks from "../NavLinks";
import Notices from "../Notices";
import OfflineIndicator from "../OfflineIndicator";
import SyncButton from "../SyncButton";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { items, lastRun, connected } = await loadDashboard();
  const problem = lastRun?.status === "error" ? lastRun : null;

  return (
    <div className="app-shell">
      <OfflineIndicator items={items} />
      {connected && <Suspense><AutoSync lastSyncedAt={lastRun?.synced_at} /></Suspense>}
      <aside className="sidebar">
        <Link className="brand" href="/"><span className="brand-mark">E</span><span>Euganeo Casa</span></Link>
        <NavLinks variant="side" />
        <div className="sidebar-foot">
          <span>{user.name}</span>
          <form action="/api/logout" method="post"><button className="link-button">Esci</button></form>
        </div>
      </aside>
      <NavLinks variant="pill" />

      <div className="content">
        <header className="topbar">
          <strong className="mobile-logo">Euganeo Casa</strong>
          <div className="topbar-actions">
            {connected && <SyncButton label={lastRun ? syncLabel(lastRun.synced_at) : "mai"} problem={Boolean(problem)} />}
            <form action="/api/logout" method="post" className="mobile-only"><button className="link-button">Esci</button></form>
          </div>
        </header>
        <main className="page">
          <Suspense><Notices /></Suspense>
          {problem && (
            <div className="notice error">
              {problem.needs_reconnect
                ? "L'autorizzazione Google è scaduta: ricollega l'account per riprendere gli aggiornamenti. "
                : `Ultima sincronizzazione non riuscita (${problem.error}). `}
              <a href="/api/google/connect"><u>Ricollega Google</u></a>
            </div>
          )}
          {!connected && (
            <section className="connect">
              <div><h2>Collega Gmail e Calendar</h2><p>Un solo accesso con l’account dove arrivano le email del condominio, in sola lettura.</p></div>
              <a className="button" href="/api/google/connect">Collega Google</a>
            </section>
          )}
          {children}
          <footer>La dashboard conserva solo oggetto, mittente, data, breve anteprima e collegamento originale delle email.</footer>
        </main>
      </div>
    </div>
  );
}
